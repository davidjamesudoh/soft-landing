import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { faqItems } from "@/lib/data";

export default function FAQ() {
  return (
    <section id="faq" className="pt-8 md:pt-12 px-3 md:px-6">
      <div className="container mx-auto">
        <h2 className="font-ed-lavonia text-black text-5xl md:text-7xl mb-11 text-center">
          Frequetly Asked Questions
        </h2>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible>
            {faqItems.map((item, index) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className={`px-4 py-2 ${index % 2 === 0 ? "bg-primary" : "bg-secondary"}`}
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-brand-dark-gray leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
