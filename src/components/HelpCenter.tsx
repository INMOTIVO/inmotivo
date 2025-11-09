import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const contactFormSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "El nombre es muy largo"),
  email: z.string().trim().email("Email inválido").max(255, "El email es muy largo"),
  subject: z.string().trim().min(5, "El asunto debe tener al menos 5 caracteres").max(200, "El asunto es muy largo"),
  message: z.string().trim().min(10, "El mensaje debe tener al menos 10 caracteres").max(1000, "El mensaje es muy largo"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface HelpCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const faqs = [
  {
    question: "¿Cómo busco propiedades en Inmotivo?",
    answer: "Usa la barra de búsqueda en la página de inicio y describe la propiedad que buscas. Puedes usar comandos de voz o escribir. Nuestro sistema te mostrará opciones cercanas a tu ubicación actual."
  },
  {
    question: "¿Puedo publicar mi propiedad sin ser inmobiliaria?",
    answer: "Sí, cualquier propietario puede publicar su inmueble. Solo necesitas registrarte como propietario y completar los datos de tu propiedad."
  },
  {
    question: "¿Cómo funciona la navegación GPS?",
    answer: "Una vez que encuentres propiedades de tu interés, puedes activar el modo de navegación para que te guiemos en tiempo real hasta las ubicaciones de las propiedades."
  },
  {
    question: "¿Es gratis usar Inmotivo?",
    answer: "Sí, la búsqueda y navegación de propiedades es completamente gratuita para los usuarios. Los propietarios pueden publicar propiedades de forma gratuita."
  },
  {
    question: "¿Cómo me comunico con el propietario?",
    answer: "En cada ficha de propiedad encontrarás un botón de contacto. Puedes enviar un mensaje directo que llegará al propietario o inmobiliaria."
  },
  {
    question: "¿Puedo guardar propiedades favoritas?",
    answer: "Sí, si estás registrado puedes guardar propiedades como favoritas para revisarlas más tarde desde tu perfil."
  },
];

const HelpCenter = ({ open, onOpenChange }: HelpCenterProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        user_id: user?.id || null,
        name: values.name,
        email: values.email,
        subject: values.subject,
        message: values.message,
        property_id: null, // No está relacionado con ninguna propiedad
      });

      if (error) throw error;

      toast.success("Mensaje enviado correctamente");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      toast.error("Error al enviar el mensaje. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Centro de Ayuda</DialogTitle>
          <DialogDescription>
            Encuentra respuestas a preguntas frecuentes o contáctanos
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="faq">Preguntas Frecuentes</TabsTrigger>
            <TabsTrigger value="contact">Contáctanos</TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="mt-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          <TabsContent value="contact" className="mt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asunto</FormLabel>
                      <FormControl>
                        <Input placeholder="¿En qué podemos ayudarte?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensaje</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe tu consulta o problema..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Enviar mensaje"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default HelpCenter;
