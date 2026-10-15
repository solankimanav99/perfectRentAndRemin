import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, RefreshCw, ChevronDown, ArrowRight } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

const HowItWorks = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const steps = [
    {
      num: '01',
      title: 'Find Your Outfit',
      desc: 'Browse our curated collection of authentic Indian designer wear including sherwanis, bridal lehengas, silk kurtas, and evening gowns.',
    },
    {
      num: '02',
      title: 'Select Event Dates & Quantity',
      desc: 'Choose your rental start date and return date. Check real-time inventory availability for your specific event dates.',
    },
    {
      num: '03',
      title: 'Confirm Booking & Security Deposit',
      desc: 'Pay the rental fee along with a flat refundable security deposit. Your security deposit is held safely during the rental period.',
    },
    {
      num: '04',
      title: 'Wear & Hand Over Return',
      desc: 'Enjoy your event! Return the outfit in the provided garment bag on your return date. Dry cleaning is on us, and your deposit is refunded!',
    },
  ];

  const faqs = [
    {
      q: 'How is the security deposit calculated and refunded?',
      a: 'The security deposit is a flat, 100% refundable amount specified on each outfit page. It is held during your rental and refunded automatically once the outfit is returned undamaged.',
    },
    {
      q: 'What happens if I return the outfit late?',
      a: 'Late returns incur a fee of ₹100 per day after the scheduled return date. Automatic return reminders will be sent to your account before your due date.',
    },
    {
      q: 'Do I need to dry clean the clothing before returning?',
      a: 'No! Complimentary professional dry cleaning and sanitization is included with every rental. Simply place the outfit back in the provided garment bag.',
    },
    {
      q: 'Can I cancel my booking?',
      a: 'Yes, any booking in PENDING or CONFIRMED status can be cancelled directly from your "My Rentals" page before pickup.',
    },
  ];

  return (
    <div className="bg-[#F4EFEA] min-h-screen py-16 px-4 sm:px-8 max-w-[1400px] mx-auto space-y-16 text-[#231F20]">
      {/* Header */}
      <ScrollReveal>
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold tracking-widest text-[#595553] uppercase block mb-1">
            SMART CLOTHING RENTAL SYSTEM
          </span>
          <h1 className="font-heading font-black text-4xl sm:text-6xl text-[#231F20] uppercase tracking-tight">
            HOW RENT WISE WORKS
          </h1>
          <p className="text-sm text-[#595553] leading-relaxed">
            Renting luxury ethnic fashion is effortless. Here is everything you need to know about browsing, booking, deposits, and returns.
          </p>
        </div>
      </ScrollReveal>

      {/* Step Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, idx) => (
          <ScrollReveal key={idx} delayIndex={idx + 1}>
            <div className="bg-white p-6 sm:p-8 border border-[#DFD5CD] octo-card-hover space-y-4 relative h-full">
              <span className="font-heading text-4xl font-black text-[#231F20] block">
                {step.num}
              </span>
              <h3 className="font-heading font-black text-lg text-[#231F20] uppercase tracking-tight">{step.title}</h3>
              <p className="text-xs text-[#595553] leading-relaxed font-sans">{step.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Policy Explainer Box */}
      <ScrollReveal>
        <div className="bg-[#EBE4DC] p-8 sm:p-10 border border-[#DFD5CD] grid grid-cols-1 md:grid-cols-2 gap-8 text-[#231F20]">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-[#231F20]">
              <ShieldCheck className="w-5 h-5 text-[#231F20]" />
              <h3 className="font-heading font-black text-base uppercase tracking-wider text-[#231F20]">
                Refundable Security Deposit
              </h3>
            </div>
            <p className="text-xs text-[#595553] leading-relaxed">
              The security deposit is separate from the rental fee and serves as a guarantee while designer garments are in your care. Once returned in clean, undamaged condition, the full deposit is refunded to your payment method.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-[#231F20]">
              <RefreshCw className="w-5 h-5 text-[#231F20]" />
              <h3 className="font-heading font-black text-base uppercase tracking-wider text-[#231F20]">
                Late Return & Fine Rules
              </h3>
            </div>
            <p className="text-xs text-[#595553] leading-relaxed">
              Our daily fine rate is fixed at <strong>₹100 per late day</strong>. Automated reminders are sent 3 days, 1 day, and on the due date to ensure hassle-free returns.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* FAQ Accordion */}
      <ScrollReveal>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#231F20]">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <p className="text-xs text-[#595553]">Quick answers to common rental questions</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#DFD5CD] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left font-heading font-black text-sm uppercase text-[#231F20] tracking-wide flex justify-between items-center"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#595553] transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-[#595553] leading-relaxed border-t border-[#DFD5CD] pt-3 font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal>
        <div className="text-center py-6">
          <Link
            to="/catalogue"
            className="octo-btn py-4 px-8 text-xs font-bold tracking-widest uppercase"
          >
            <span>EXPLORE DESIGNER OUTFITS NOW</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </ScrollReveal>
    </div>
  );
};

export default HowItWorks;
