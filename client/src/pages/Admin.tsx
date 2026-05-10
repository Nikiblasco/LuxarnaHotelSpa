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

export default function Admin() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isAuth,   setIsAuth]   = useState(false);

  const [roomId,       setRoomId]       = useState("");
  const [guestName,    setGuestName]    = useState("");
  const [checkIn,      setCheckIn]      = useState("");
  const [checkOut,     setCheckOut]     = useState("");
  const [checkinTime,  setCheckinTime]  = useState("");

  // ── Server-side login ──────────────────────────────────────────────────────
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

  const { data: rooms    } = useQuery<Room[]>   ({ queryKey: ["/api/rooms"],    enabled: isAuth });
  const { data: bookings } = useQuery<Booking[]>({ queryKey: ["/api/bookings"], enabled: isAuth });

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bookings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Walk-in added successfully" });
      setGuestName("");
      setCheckIn("");
      setCheckOut("");
      setRoomId("");
      setCheckinTime("");
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
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
          </CardHeader>
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
              {loginMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking…</>
              ) : "Login"}
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

        <Card>
          <CardHeader>
            <CardTitle>Add Walk-in Guest</CardTitle>
          </CardHeader>
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
              <Input
                data-testid="input-guest-name"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Check-in Date</Label>
              <Input
                type="date"
                data-testid="input-walkin-checkin"
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Check-in Time</Label>
              <Input
                type="time"
                data-testid="input-walkin-checkin-time"
                value={checkinTime}
                onChange={e => setCheckinTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Check-out Date</Label>
              <Input
                type="date"
                data-testid="input-walkin-checkout"
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Check-out Time</Label>
              <Input
                value="12:00 PM"
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
            <Button
              data-testid="button-add-booking"
              onClick={() => bookingMutation.mutate({
                roomId,
                guestName,
                checkIn,
                checkOut,
                checkinTime: checkinTime
                  ? new Date(`1970-01-01T${checkinTime}`).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : undefined,
                checkoutTime: "12:00 PM",
              })}
              disabled={bookingMutation.isPending || !roomId || !guestName || !checkIn || !checkOut}
            >
              {bookingMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding…</>
              ) : "Add Booking"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Bookings</CardTitle>
          </CardHeader>
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
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        No bookings yet
                      </td>
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

      </div>
      <Footer />
    </div>
  );
}