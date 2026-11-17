import { useRef, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  BedDouble,
  ConciergeBell,
  Wine,
  ChefHat,
  Briefcase,
  ClipboardCheck,
  Upload,
  CheckCircle2,
} from "lucide-react";

const roles = [
  {
    title: "Housekeeping",
    icon: BedDouble,
    description: "Keep rooms and shared spaces clean, fresh and guest-ready.",
  },
  {
    title: "Receptionist",
    icon: ConciergeBell,
    description: "Welcome guests, manage bookings and handle check-in and check-out.",
  },
  {
    title: "Bartender",
    icon: Wine,
    description: "Prepare and serve drinks and give guests a great bar experience.",
  },
  {
    title: "Cook",
    icon: ChefHat,
    description: "Prepare quality meals for our restaurant and room service.",
  },
  {
    title: "Supervisor",
    icon: ClipboardCheck,
    description: "Guide daily team operations and keep service standards high.",
  },
  {
    title: "Manager",
    icon: Briefcase,
    description: "Lead a department, support the team and deliver guest satisfaction.",
  },
];

const MAX_CV_SIZE_MB = 5;
const ALLOWED_CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

type FormErrors = Partial<Record<"fullName" | "email" | "phone" | "role" | "cv", string>>;

export default function JoinOurTeam() {
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleApplyClick = (roleTitle: string) => {
    setRole(roleTitle);
    setSubmitted(false);
    setErrors((prev) => ({ ...prev, role: undefined }));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setCv(null);
      return;
    }
    if (!ALLOWED_CV_TYPES.includes(file.type)) {
      setCv(null);
      setErrors((prev) => ({ ...prev, cv: "Upload your CV as a PDF or Word file (.pdf, .doc, .docx)." }));
      return;
    }
    if (file.size > MAX_CV_SIZE_MB * 1024 * 1024) {
      setCv(null);
      setErrors((prev) => ({ ...prev, cv: `Your CV must be smaller than ${MAX_CV_SIZE_MB}MB.` }));
      return;
    }
    setCv(file);
    setErrors((prev) => ({ ...prev, cv: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (fullName.trim().length < 2) next.fullName = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (phone.replace(/\D/g, "").length < 7) next.phone = "Enter a valid phone number.";
    if (!role) next.role = "Choose the role you are applying for.";
    if (!cv) next.cv = "Attach your CV as a PDF or Word file.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setRole("");
    setMessage("");
    setCv(null);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("fullName", fullName.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("role", role);
      formData.append("message", message.trim());
      if (cv) formData.append("cv", cv);

      const res = await fetch("/api/applications", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Request failed");
      }

      setSubmitted(true);
      resetForm();
      toast({
        title: "Application sent",
        description: "Thank you for applying. Our team will be in touch if your profile fits.",
      });
    } catch (error) {
      toast({
        title: "Application not sent",
        description:
          error instanceof Error && error.message !== "Request failed"
            ? error.message
            : "Something went wrong. Check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-primary font-medium tracking-widest uppercase text-sm mb-3" data-testid="text-careers-subtitle">
              Careers
            </p>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4" data-testid="text-careers-title">
              Join Our Team
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-careers-desc">
              Help us give every guest a peaceful stay at Luxarna. Pick the role that fits you and send your application below.
            </p>
          </div>

          {/* Open roles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 md:mb-20">
            {roles.map((item, index) => (
              <Card key={item.title} className="p-6 flex flex-col hover-elevate" data-testid={`card-role-${index}`}>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-1">{item.title}</h3>
                <p className="text-muted-foreground text-sm mb-5 flex-1">{item.description}</p>
                <Button
                  variant={role === item.title ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleApplyClick(item.title)}
                  data-testid={`button-apply-${item.title.toLowerCase()}`}
                >
                  Apply for {item.title}
                </Button>
              </Card>
            ))}
          </div>

          {/* Application form */}
          <div ref={formRef} className="max-w-2xl mx-auto scroll-mt-28">
            <div className="text-center mb-8">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2" data-testid="text-form-title">
                Send your application
              </h2>
              <p className="text-muted-foreground">Fields marked with * are required.</p>
            </div>

            <Card className="p-6 md:p-8">
              {submitted && (
                <div
                  className="flex items-start gap-3 rounded-md bg-primary/10 p-4 mb-6"
                  role="status"
                  data-testid="text-application-success"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">
                    Your application has been sent. You can apply for another role by choosing it above.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    aria-invalid={!!errors.fullName}
                    data-testid="input-full-name"
                  />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      data-testid="input-email"
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      aria-invalid={!!errors.phone}
                      data-testid="input-phone"
                    />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={role}
                    onValueChange={(value) => {
                      setRole(value);
                      setErrors((prev) => ({ ...prev, role: undefined }));
                    }}
                  >
                    <SelectTrigger id="role" aria-invalid={!!errors.role} data-testid="select-role">
                      <SelectValue placeholder="Choose a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((item) => (
                        <SelectItem key={item.title} value={item.title}>
                          {item.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cv">CV (PDF or Word, up to {MAX_CV_SIZE_MB}MB) *</Label>
                  <input
                    ref={fileInputRef}
                    id="cv"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="sr-only"
                    data-testid="input-cv"
                  />
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-choose-cv"
                    >
                      <Upload className="w-4 h-4" />
                      {cv ? "Change file" : "Choose file"}
                    </Button>
                    <span className="text-sm text-muted-foreground break-all">
                      {cv ? cv.name : "No file chosen"}
                    </span>
                  </div>
                  {errors.cv && <p className="text-sm text-destructive">{errors.cv}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Tell us about yourself</Label>
                  <Textarea
                    id="message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Your experience, availability and why you want to join Luxarna."
                    data-testid="input-message"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-submit-application">
                  {isSubmitting ? "Sending application..." : "Send application"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}