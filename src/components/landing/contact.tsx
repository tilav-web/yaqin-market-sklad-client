'use client';

import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Send } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { api, extractErrorMessage } from '@/lib/api';

function isValidPhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 9;
}

export function LandingContact() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: async () => {
      await api.post('/contact', { name: name.trim(), phone: phone.trim(), message: message.trim() });
    },
    onSuccess: () => {
      setName('');
      setPhone('');
      setMessage('');
    },
    onError: (e) => setError(extractErrorMessage(e)),
  });

  const canSubmit =
    name.trim().length > 0 && isValidPhone(phone) && message.trim().length > 0 && !submit.isPending;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!canSubmit) return;
    submit.mutate();
  }

  return (
    <section id="boglanish" className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Biz bilan bog&apos;laning
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          Savol yoki taklifingiz bormi? Ma&apos;lumotlaringizni qoldiring, tez orada bog&apos;lanamiz.
        </p>
      </div>

      <Card className="mt-10 p-6 sm:p-8">
        {submit.isSuccess ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="size-8" />
            </div>
            <p className="text-base font-semibold text-foreground">
              Murojaatingiz qabul qilindi, tez orada bog&apos;lanamiz
            </p>
            <Button variant="outline" onClick={() => submit.reset()}>
              Yangi murojaat yuborish
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="contact-name" className="text-sm font-medium text-foreground">
                Ism
              </label>
              <Input
                id="contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ismingiz"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-phone" className="text-sm font-medium text-foreground">
                Telefon
              </label>
              <Input
                id="contact-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                inputMode="tel"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-message" className="text-sm font-medium text-foreground">
                Xabar
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Xabaringizni yozing..."
                rows={4}
                className="w-full min-w-0 resize-y rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" size="lg" disabled={!canSubmit} className="h-11 w-full text-base">
              <Send className="size-4" />
              {submit.isPending ? 'Yuborilmoqda…' : 'Yuborish'}
            </Button>
          </form>
        )}
      </Card>
    </section>
  );
}
