"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Play,
  Square,
  RotateCcw,
  Trophy,
  ExternalLink,
  Users,
  Gift,
  Clock,
  Loader2,
} from "lucide-react";

interface DrawSettings {
  id: string;
  current_prize: string;
  background_url: string;
  is_spinning: boolean;

  // Legacy single winner fields (kept for backward compatibility)
  winning_code: string;
  winning_name: string;

  // Multi-winner fields
  draw_mode: number; // 1-10
  winning_codes: string[];
  winning_names: string[];
  winning_count: number;

  show_result: boolean;
}

interface Customer {
  id: string;
  bracelet_code: string;
  name: string;
  phone: string;
  has_won: boolean;
  prize_name: string | null;
}

export default function DrawControlPage() {
  const [settings, setSettings] = useState<DrawSettings | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [prize, setPrize] = useState("");
  const [loading, setLoading] = useState(false);
  const [spinDuration, setSpinDuration] = useState(3);
  const [drawMode, setDrawMode] = useState<number>(1);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const supabase = createClient();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: settingsData } = await supabase.from("draw_settings").select("*").single();

      if (settingsData) {
        setSettings(settingsData);
        setPrize(settingsData.current_prize || "");
      }

      const { data: customersData } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (customersData) {
        setCustomers(customersData);
      }
    };

    fetchData();
  }, [supabase]);

  const updatePrize = async () => {
    if (!settings) return;

    const { error } = await supabase
      .from("draw_settings")
      .update({ current_prize: prize, updated_at: new Date().toISOString() })
      .eq("id", settings.id);

    if (error) {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    } else {
      toast({ variant: "success", title: "Thành công", description: "Đã cập nhật tên giải" });
      setSettings({ ...settings, current_prize: prize });
    }
  };

  const startSpin = async () => {
    if (!settings) return;

    const eligibleCustomers = customers.filter((c) => !c.has_won);

    // Check if there are any eligible customers
    if (eligibleCustomers.length === 0) {
      toast({
        variant: "warning",
        title: "Không có người chơi",
        description: "Không còn ai chưa trúng thưởng",
      });
      return;
    }

    // Check if enough eligible customers for selected draw mode
    if (eligibleCustomers.length < drawMode) {
      toast({
        variant: "warning",
        title: "Không đủ người chơi",
        description: `Chỉ còn ${eligibleCustomers.length} người chưa trúng, nhưng bạn chọn quay ${drawMode} người`,
      });
      return;
    }

    setLoading(true);

    // Reset and start spinning
    const { error: startError } = await supabase
      .from("draw_settings")
      .update({
        is_spinning: true,
        show_result: false,
        draw_mode: drawMode,
        winning_codes: [],
        winning_names: [],
        winning_count: 0,
        // Keep legacy fields for backward compatibility
        winning_code: "",
        winning_name: "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    if (startError) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể bắt đầu quay số: " + startError.message,
      });
      setLoading(false);
      return;
    }

    setSettings({
      ...settings,
      is_spinning: true,
      show_result: false,
      draw_mode: drawMode,
      winning_codes: [],
      winning_names: [],
      winning_count: 0,
      winning_code: "",
      winning_name: "",
    });

    spinTimeoutRef.current = setTimeout(async () => {
      // Re-fetch eligible customers to avoid race conditions
      const { data: freshCustomers } = await supabase
        .from("customers")
        .select("id, bracelet_code, name, phone, has_won, prize_name")
        .eq("has_won", false);

      const currentEligible = freshCustomers || eligibleCustomers;

      if (currentEligible.length < drawMode) {
        toast({
          variant: "warning",
          title: "Không đủ người chơi",
          description: `Không đủ người chưa trúng thưởng (cần ${drawMode}, còn ${currentEligible.length})`,
        });
        setLoading(false);
        spinTimeoutRef.current = null;
        return;
      }

      // Select multiple winners randomly (without replacement)
      const winners: typeof currentEligible = [];
      const eligiblePool = [...currentEligible];

      for (let i = 0; i < drawMode; i++) {
        const randomIndex = Math.floor(Math.random() * eligiblePool.length);
        winners.push(eligiblePool[randomIndex]);
        eligiblePool.splice(randomIndex, 1); // Remove selected winner from pool
      }

      const winningCodes = winners.map((w) => w.bracelet_code);
      const winningNames = winners.map((w) => w.name);

      // Update draw_settings with results
      const { error: resultError } = await supabase
        .from("draw_settings")
        .update({
          is_spinning: false,
          show_result: true,
          winning_codes: winningCodes,
          winning_names: winningNames,
          winning_count: winners.length,
          // Update legacy fields with first winner for backward compatibility
          winning_code: winningCodes[0],
          winning_name: winningNames[0],
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);

      if (resultError) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể cập nhật kết quả: " + resultError.message,
        });
        setLoading(false);
        spinTimeoutRef.current = null;
        return;
      }

      // Batch update all winners in customers table
      const updatePromises = winners.map((winner) =>
        supabase
          .from("customers")
          .update({
            has_won: true,
            prize_name: prize,
          })
          .eq("id", winner.id)
      );

      const updateResults = await Promise.all(updatePromises);

      const hasError = updateResults.some((result) => result.error);
      if (hasError) {
        toast({
          variant: "destructive",
          title: "Cảnh báo",
          description: "Một số người trúng có thể chưa được cập nhật đầy đủ",
        });
      }

      // Update local state
      setSettings({
        ...settings,
        is_spinning: false,
        show_result: true,
        draw_mode: drawMode,
        winning_codes: winningCodes,
        winning_names: winningNames,
        winning_count: winners.length,
        winning_code: winningCodes[0],
        winning_name: winningNames[0],
      });

      setCustomers((prev) =>
        prev.map((c) => {
          const isWinner = winners.some((w) => w.id === c.id);
          return isWinner ? { ...c, has_won: true, prize_name: prize } : c;
        })
      );

      toast({
        title: `${winners.length} người trúng thưởng!`,
        description:
          winners.length === 1
            ? `${winners[0].name} - ${winners[0].bracelet_code}`
            : winners.map((w) => w.name).join(", "),
      });

      setLoading(false);
      spinTimeoutRef.current = null;
    }, spinDuration * 1000);
  };

  const stopSpin = async () => {
    if (!settings) return;

    // Clear pending timeout
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = null;
    }

    const { error: stopError } = await supabase
      .from("draw_settings")
      .update({
        is_spinning: false,
        show_result: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    if (stopError) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể dừng quay: " + stopError.message,
      });
    } else {
      toast({ title: "Đã dừng quay" });
    }

    setSettings({ ...settings, is_spinning: false, show_result: false });
    setLoading(false);
  };

  const resetDisplay = async () => {
    if (!settings) return;

    const { error: resetError } = await supabase
      .from("draw_settings")
      .update({
        is_spinning: false,
        show_result: false,
        winning_code: "",
        winning_name: "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    if (resetError) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể reset: " + resetError.message,
      });
      return;
    }

    setSettings({
      ...settings,
      is_spinning: false,
      show_result: false,
      winning_code: "",
      winning_name: "",
    });

    toast({ title: "Đã reset màn hình" });
  };

  const eligibleCount = customers.filter((c) => !c.has_won).length;
  const wonCount = customers.filter((c) => c.has_won).length;

  const prizeOptions = [
    "Giải Đặc Biệt",
    "Giải Nhất",
    "Giải Nhì",
    "Giải Ba",
    "Giải 4",
    "Giải 5",
    "Giải 6",
    "Giải 7",
    "Giải 8",
    "Giải 9",
    "Giải Khuyến Khích",
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Điều khiển quay số</h1>
          <p className="text-muted-foreground text-sm">
            Quản lý và điều khiển trang quay số trực tiếp
          </p>
        </div>
        <Button onClick={() => window.open("/draw", "_blank")}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Mở trang quay số
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng người chơi</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Gift className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chưa trúng</p>
                <p className="text-2xl font-bold text-green-600">{eligibleCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Trophy className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đã trúng</p>
                <p className="text-2xl font-bold text-orange-600">{wonCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Control Panel */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Bảng điều khiển</CardTitle>
              <CardDescription>
                Trạng thái:{" "}
                {settings?.is_spinning ? (
                  <Badge variant="default" className="bg-yellow-500 animate-pulse">
                    Đang quay...
                  </Badge>
                ) : settings?.show_result ? (
                  <Badge variant="default" className="bg-green-500">
                    Đã có kết quả
                  </Badge>
                ) : (
                  <Badge variant="secondary">Sẵn sàng</Badge>
                )}
              </CardDescription>
            </div>

            {settings?.show_result && settings?.winning_count > 0 && (
              <div className="text-right max-w-md">
                <p className="text-sm text-muted-foreground">
                  Người trúng ({settings.winning_count})
                </p>
                {settings.winning_count === 1 ? (
                  <>
                    <p className="font-bold text-green-600">{settings.winning_names[0]}</p>
                    <p className="font-mono text-lg">{settings.winning_codes[0]}</p>
                  </>
                ) : (
                  <div className="max-h-24 overflow-y-auto space-y-1 mt-1">
                    {settings.winning_names.map((name, idx) => (
                      <div key={idx} className="text-sm flex justify-between gap-2">
                        <span className="font-semibold text-green-600 truncate">{name}</span>
                        <span className="font-mono">{settings.winning_codes[idx]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Control Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Thời gian quay
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={spinDuration}
                  onChange={(e) => setSpinDuration(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">giây</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={startSpin}
                disabled={loading || settings?.is_spinning || eligibleCount === 0}
                className="bg-green-600 hover:bg-green-700 min-w-[140px]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 mr-2" />
                )}
                Bắt đầu quay
              </Button>

              <Button
                size="lg"
                variant="destructive"
                onClick={stopSpin}
                disabled={!settings?.is_spinning}
              >
                <Square className="w-5 h-5 mr-2" />
                Dừng
              </Button>

              <Button size="lg" variant="outline" onClick={resetDisplay}>
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          <Separator />

          {/* Prize Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Trophy className="w-4 h-4" />
              Chọn giải thưởng
            </Label>
            <div className="flex flex-wrap gap-2">
              {prizeOptions.map((p) => (
                <Button
                  key={p}
                  variant={prize === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPrize(p);
                  }}
                  className={prize === p ? "bg-purple-600 hover:bg-purple-700" : ""}
                >
                  {p}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={prize}
                onChange={(e) => setPrize(e.target.value)}
                placeholder="Hoặc nhập tên giải tùy chỉnh..."
                className="max-w-sm"
              />
              <Button onClick={updatePrize} variant="secondary">
                Cập nhật
              </Button>
            </div>
          </div>

          <Separator />

          {/* Draw Mode Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Users className="w-4 h-4" />
              Số người trúng thưởng
            </Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={drawMode === 1 ? "default" : "outline"}
                size="lg"
                onClick={() => setDrawMode(1)}
                className={drawMode === 1 ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                1 người
              </Button>
              <Button
                variant={drawMode === 5 ? "default" : "outline"}
                size="lg"
                onClick={() => setDrawMode(5)}
                className={drawMode === 5 ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                5 người
              </Button>
              <Button
                variant={drawMode === 10 ? "default" : "outline"}
                size="lg"
                onClick={() => setDrawMode(10)}
                className={drawMode === 10 ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                10 người
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <Label htmlFor="custom-draw-mode" className="whitespace-nowrap">
                Hoặc nhập tùy chỉnh:
              </Label>
              <Input
                id="custom-draw-mode"
                type="number"
                min={1}
                max={10}
                value={drawMode}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setDrawMode(Math.min(10, Math.max(1, value)));
                }}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                (Tối đa 10 người, 5 người/hàng)
              </span>
            </div>
            {drawMode > eligibleCount && eligibleCount > 0 && (
              <p className="text-sm text-amber-600">
                ⚠️ Chỉ còn {eligibleCount} người chưa trúng, nhưng bạn chọn quay {drawMode} người
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Winners List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-500" />
            Danh sách trúng thưởng ({wonCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wonCount === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Chưa có ai trúng thưởng</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {customers
                .filter((c) => c.has_won)
                .map((winner, index) => (
                  <div
                    key={winner.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{winner.name}</p>
                        <p className="text-sm text-muted-foreground">{winner.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold text-green-600">
                        {winner.bracelet_code}
                      </p>
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        {winner.prize_name || "N/A"}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
