import { request } from './apiClient';

export const chatbotService = {
  sendMessage: async (message) => {
    try {
      const res = await request('/chatbot', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      return res.data;
    } catch (err) {
      if (err.code === 'NETWORK_ERROR') {
        const msg = message.toLowerCase();
        let reply =
          "I'm your Perfect Rent & Remind assistant! How can I help you today? Ask me about renting, security deposits, returns, or late fines.";

        if (msg.includes('rent') || msg.includes('how to rent')) {
          reply =
            'Renting is simple! 1. Browse our luxury designer collection. 2. Select event dates and size. 3. Confirm your booking with a refundable deposit. 4. Wear & return in our pre-paid dry cleaning bag!';
        } else if (msg.includes('deposit')) {
          reply =
            'The security deposit is 100% refundable once the clothing is returned undamaged. It is held safely during your rental period.';
        } else if (msg.includes('return') || msg.includes('late')) {
          reply =
            'Please return items on or before your scheduled return date. Late returns incur a fine of ₹100/day.';
        } else if (msg.includes('cancel')) {
          reply = 'You can cancel any booking in PENDING or CONFIRMED status directly from your "My Rentals" dashboard.';
        }

        return { reply };
      }
      throw err;
    }
  },
};
