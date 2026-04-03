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

export default function Admin() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  
  // Form state
  const [roomId, setRoomId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const { data: rooms } = useQuery<Room[]>({ queryKey: ["/api/rooms"] });
  const { data: bookings } = useQuery<Booking[]>({ queryKey: ["/api/bookings"] });

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
    },
    onError: (err: any) => {
      toast({ title: "Failed to add walk-in", description: err.message, variant: "destructive" });
    }
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
    }
  });

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
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Button className="w-full" onClick={() => password === "luxarna-admin" ? setIsAuth(true) : toast({title: "Access Denied", variant: "destructive"})}>
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-24 space-y-12">
        <Card>
          <CardHeader>
            <CardTitle>Add Walk-in Guest</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label>Room</Label>
              <select 
                className="w-full h-10 px-3 rounded-md border"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
              >
                <option value="">Select Room</option>
                <optgroup label="Deluxe King Suite">
                  {rooms?.filter(r => r.type === "Deluxe King Suite").map(r => (
                    <option key={r.id} value={r.id}>Room {r.id} — {r.type}</option>
                  ))}
                </optgroup>
                <optgroup label="King Suite">
                  {rooms?.filter(r => r.type === "King Suite").map(r => (
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
              <Input value={guestName} onChange={e => setGuestName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Check-in</Label>
              <Input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Check-out</Label>
              <Input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
            </div>
            <Button onClick={() => bookingMutation.mutate({roomId, guestName, checkIn, checkOut})} disabled={bookingMutation.isPending}>
              Add Booking
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
                    <th className="p-3">Check-out</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings && bookings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-muted-foreground">No bookings yet</td>
                    </tr>
                  )}
                  {bookings?.map(b => (
                    <tr key={b.id} className="border-b">
                      <td className="p-3 font-medium">{b.guestName}</td>
                      <td className="p-3">{rooms?.find(r => r.id === b.roomId)?.name}</td>
                      <td className="p-3">{format(new Date(b.checkIn), "MMM dd, yyyy")}</td>
                      <td className="p-3">{format(new Date(b.checkOut), "MMM dd, yyyy")}</td>
                      <td className="p-3">
                        <Button
                          variant="destructive"
                          size="sm"
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
