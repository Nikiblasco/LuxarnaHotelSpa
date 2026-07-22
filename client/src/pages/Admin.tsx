import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Room, Booking } from "@shared/schema";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

// ── helpers ───────────────────────────────────────────────────────────────────

const ROOM_PRICES: Record<string, number> = {
  "206": 50000, "204": 40000,
  "101": 30000, "102": 30000, "201": 30000,
  "202": 30000, "203": 30000, "205": 30000,
  "103": 23000,
};

function nightsBetween(checkIn: Date, checkOut: Date) {
  return Math.max(
    1,
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000)
  );
}

function fmt(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

// ── Monthly stats widget (inline, no external chart lib needed) ───────────────

function MonthlyStats({ allBookings, rooms }: { allBookings: Booking[]; rooms: Room[] }) {
  const [year, setYear] = useState(new Date().getFullYear());

  // Build month buckets using UTC so midnight UTC dates do not shift
  // into the previous day/month in the browser's local timezone.
  const months = Array.from({ length: 12 }, (_, i) => {
    const label = new Date(Date.UTC(year, i, 1)).toLocaleString("en", {
      month: "short",
      timeZone: "UTC",
    });

    const inMonth = allBookings.filter(b => {
      const d = new Date(b.checkIn);
      return d.getUTCFullYear() === year && d.getUTCMonth() === i;
    });

    const revenue = inMonth.reduce(
      (sum, b) => sum + nightsBetween(b.checkIn, b.checkOut) * (ROOM_PRICES[b.roomId] ?? 30000),
      0
    );

    return { label, count: inMonth.length, revenue };
  });

  const maxCount = Math.max(...months.map(m => m.count), 1);
  const totalBookings = months.reduce((s, m) => s + m.count, 0);
  const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);

  // Most booked room type for the selected year.
  const typeCounts: Record<string, number> = {};
  allBookings
    .filter(b => new Date(b.checkIn).getUTCFullYear() === year)
    .forEach(b => {
      const room = rooms.find(r => r.id === b.roomId);
      const type = room?.type ?? "Unknown";
      typeCounts[type] = (typeCounts[type] ?? 0) + 1;
    });

  const topRoom = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const availableYears = [
    ...new Set(allBookings.map(b => new Date(b.checkIn).getUTCFullYear())),
  ].sort((a, b) => b - a);

  if (!availableYears.includes(year) && availableYears.length > 0) {
    availableYears.unshift(year);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Monthly Booking Stats</CardTitle>
        <select
          className="h-9 px-3 rounded-md border bg-background text-sm"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
        >
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total bookings", value: totalBookings },
            { label: "Est. revenue", value: fmt(totalRevenue) },
            { label: "Most booked room", value: topRoom },
          ].map(c => (
            <div key={c.label} className="rounded-lg bg-muted p-4">
              <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
              <p className="text-lg font-medium truncate">{c.value}</p>
            </div>
          ))}
        </div>
{/* Bar chart */}
<div>
  <p className="text-xs text-muted-foreground mb-3">Bookings per month</p>
  <div className="flex items-end gap-1.5" style={{ height: "160px" }}>
    {months.map(m => {
      const pct = maxCount === 0 ? 0 : (m.count / maxCount) * 100;
      return (
        <div key={m.label} className="flex-1 flex flex-col items-center gap-1 group" style={{ height: "100%" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
            <div
              className="w-full rounded-t-sm bg-primary transition-all duration-300"
              style={{ height: `${Math.max(pct, m.count > 0 ? 8 : 0)}%` }}
              title={`${m.label}: ${m.count} booking${m.count !== 1 ? "s" : ""} · ${fmt(m.revenue)}`}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{m.label}</span>
        </div>
      );
    })}
  </div>
</div>

        {/* Revenue table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted">
              <tr>
                <th className="p-2">Month</th>
                <th className="p-2 text-right">Bookings</th>
                <th className="p-2 text-right">Est. Revenue</th>
              </tr>
            </thead>
            <tbody>
              {months.map(m => (
                <tr key={m.label} className="border-b">
                  <td className="p-2">{m.label} {year}</td>
                  <td className="p-2 text-right">{m.count}</td>
                  <td className="p-2 text-right">{m.count > 0 ? fmt(m.revenue) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </CardContent>
    </Card>
  );
}

// ── Main Admin page ───────────────────────────────────────────────────────────

export default function Admin() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isAuth,   setIsAuth]   = useState(false);
  const [isPastBooking, setIsPastBooking] = useState(false);
  const [roomId,       setRoomId]       = useState("");
  const [guestName,    setGuestName]    = useState("");
  const [checkIn,      setCheckIn]      = useState("");
  const [checkOut,     setCheckOut]     = useState("");
  const [checkinTime,  setCheckinTime]  = useState("");

  // ── Server-side login ─────────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: async (pwd: string) => {
      const res = await apiRequest("POST", "/api/admin/login", { password: pwd });
      if (!res.ok) throw new Error("Access denied");
      return res.json();
    },
    onSuccess: () => setIsAuth(true),
    onError: () =>
      toast({ title: "Access Denied", description: "Incorrect password.", variant: "destructive" }),
  });

  const { data: rooms       } = useQuery<Room[]>   ({ queryKey: ["/api/rooms"],            enabled: isAuth });
  const { data: bookings    } = useQuery<Booking[]>({ queryKey: ["/api/bookings"],          enabled: isAuth });
  const { data: allBookings } = useQuery<Booking[]>({ queryKey: ["/api/bookings/stats"],   enabled: isAuth });

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bookings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/stats"] });
     toast({
  title: isPastBooking
    ? "Past booking added successfully"
    : "Walk-in added successfully",
  });
      setGuestName(""); setCheckIn(""); setCheckOut(""); setRoomId(""); setCheckinTime("");
    },
    onError: (err: any) => {
      toast({ title: "Failed to add walk-in", description: err.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/bookings/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/stats"] });
      toast({ title: "Booking cancelled successfully" });
    },
    onError: () => {
      toast({ title: "Failed to cancel booking", variant: "destructive" });
    },
  });

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader><CardTitle>Admin Access</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter Admin Password"
              data-testid="input-admin-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && loginMutation.mutate(password)}
            />
            <Button
              className="w-full"
              data-testid="button-admin-login"
              disabled={loginMutation.isPending}
              onClick={() => loginMutation.mutate(password)}
            >
              {loginMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking…</>
                : "Login"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Admin dashboard ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-24 space-y-12">
        <div className="flex items-center gap-2 mb-4">
  <input
    type="checkbox"
    checked={isPastBooking}
    onChange={(e) => setIsPastBooking(e.target.checked)}
  />
  <Label>Add as Past Booking</Label>
</div>
        {/* Add Walk-in */}
        <Card>
          <CardHeader><CardTitle>Add Booking (Walk-in / Past Booking)</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
            <div className="space-y-2">
              <Label>Room</Label>
              <select
                className="w-full h-10 px-3 rounded-md border bg-background"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                data-testid="select-room"
              >
                <option value="">Select Room</option>
                <optgroup label="King Suite">
                  {rooms?.filter(r => r.type === "King Suite").map(r => (
                    <option key={r.id} value={r.id}>Room {r.id} — {r.type}</option>
                  ))}
                </optgroup>
                <optgroup label="Queen Suite">
                  {rooms?.filter(r => r.type === "Queen Suite").map(r => (
                    <option key={r.id} value={r.id}>Room {r.id} — {r.type}</option>
                  ))}
                </optgroup>
                <optgroup label="Deluxe Rooms">
                  {rooms?.filter(r => r.type === "Deluxe Room").map(r => (
                    <option key={r.id} value={r.id}>Room {r.id} — {r.type}</option>
                  ))}
                </optgroup>
                <optgroup label="Standard Room">
                  {rooms?.filter(r => r.type === "Standard Room").map(r => (
                    <option key={r.id} value={r.id}>Room {r.id} — {r.type}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Guest Name</Label>
              <Input data-testid="input-guest-name" value={guestName} onChange={e => setGuestName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Check-in Date</Label>
              <Input type="date" data-testid="input-walkin-checkin" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Check-in Time</Label>
              <Input type="time" data-testid="input-walkin-checkin-time" value={checkinTime} onChange={e => setCheckinTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Check-out Date</Label>
              <Input type="date" data-testid="input-walkin-checkout" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Check-out Time</Label>
              <Input value="12:00 PM" disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
            </div>
            <Button
              data-testid="button-add-booking"
              onClick={() => bookingMutation.mutate({
                roomId, guestName, checkIn, checkOut,
                checkinTime: checkinTime
                  ? new Date(`1970-01-01T${checkinTime}`).toLocaleTimeString("en-US", {
                      hour: "numeric", minute: "2-digit", hour12: true,
                    })
                  : undefined,
                checkoutTime: "12:00 PM",
              })}
              disabled={bookingMutation.isPending || !roomId || !guestName || !checkIn || !checkOut}
            >
              {bookingMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding…</>
                :isPastBooking ? "Add Past Booking" : "Add Walk-in"}
            </Button>
          </CardContent>
        </Card>

        {/* Active Bookings */}
        <Card>
          <CardHeader><CardTitle>Active Bookings</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3">Guest</th>
                    <th className="p-3">Room</th>
                    <th className="p-3">Check-in</th>
                    <th className="p-3">Check-in Time</th>
                    <th className="p-3">Check-out</th>
                    <th className="p-3">Check-out Time</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings && bookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">No active bookings</td>
                    </tr>
                  )}
                  {bookings?.map(b => (
                    <tr key={b.id} className="border-b" data-testid={`row-booking-${b.id}`}>
                      <td className="p-3 font-medium">{b.guestName}</td>
                      <td className="p-3">{rooms?.find(r => r.id === b.roomId)?.name ?? b.roomId}</td>
                      <td className="p-3">{format(new Date(b.checkIn), "MMM dd, yyyy")}</td>
                      <td className="p-3">{b.checkinTime ?? "—"}</td>
                      <td className="p-3">{format(new Date(b.checkOut), "MMM dd, yyyy")}</td>
                      <td className="p-3">{b.checkoutTime ?? "12:00 PM"}</td>
                      <td className="p-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          data-testid={`button-cancel-${b.id}`}
                          disabled={cancelMutation.isPending}
                          onClick={() => cancelMutation.mutate(b.id)}
                        >
                          Cancel
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Stats */}
        {allBookings && rooms && (
          <MonthlyStats allBookings={allBookings} rooms={rooms} />
        )}

      </div>
      <Footer />
    </div>
  );
}