import ContactForm from "../ContactForm";
import { Toaster } from "@/components/ui/toaster";

export default function ContactFormExample() {
  return (
    <div className="max-w-lg">
      <ContactForm />
      <Toaster />
    </div>
  );
}
