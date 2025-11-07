'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import FeedbackForm from './FeedbackForm';

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-40"
        aria-label="Send feedback"
        title="Send feedback"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {isOpen && <FeedbackForm onClose={() => setIsOpen(false)} />}
    </>
  );
}
