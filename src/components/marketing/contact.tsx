'use client';

import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Send } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/card';
import { useT } from '@/lib/i18n/use-t';
import { api, extractErrorMessage } from '@/lib/api';

function isValidPhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 9;
}

export function MarketingContact() {
  const { t } = useT();
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
    onError: (e) => setError(extractErrorMessage(e) || t.contact.error),
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
    <section id="boglanish" className="mx-auto max-w-3xl px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          {t.contact.title}
        </h2>
        <p className="mt-4 text-pretty text-sm leading-relaxed text-zinc-500">{t.contact.desc}</p>
      </div>

      <Card className="mt-12 border border-zinc-200/80 bg-white p-8 sm:p-10 rounded-3xl shadow-sm">
        {submit.isSuccess ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
              <CheckCircle2 className="size-6" />
            </div>
            <p className="font-heading text-base font-semibold text-zinc-900">{t.contact.success}</p>
            <Button variant="outline" className="rounded-full mt-2" onClick={() => submit.reset()}>
              {t.contact.newMsg}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="contact-name" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {t.contact.name}
              </label>
              <Input
                id="contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.contact.namePh}
                className="h-11 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none transition-colors placeholder:text-zinc-400 focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="contact-phone" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {t.contact.phone}
              </label>
              <Input
                id="contact-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.contact.phonePh}
                inputMode="tel"
                className="h-11 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none transition-colors placeholder:text-zinc-400 focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="contact-message" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {t.contact.message}
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.contact.messagePh}
                rows={4}
                className="w-full min-w-0 resize-y rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-50"
              />
            </div>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            <Button
              type="submit"
              size="lg"
              disabled={!canSubmit}
              className="h-12 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
              <Send className="size-4" />
              {submit.isPending ? t.contact.submitting : t.contact.submit}
            </Button>
          </form>
        )}
      </Card>
    </section>
  );
}
