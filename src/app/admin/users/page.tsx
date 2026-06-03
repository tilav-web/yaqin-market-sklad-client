import { Users } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card } from '@/components/ui/card';

export default function UsersAdminPage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Hisoblar"
        title="Foydalanuvchilar"
        description="Foydalanuvchilar ro'yxati va bloklash boshqaruvi."
      />
      <Card className="flex flex-col items-center gap-3 border-dashed py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          <Users className="size-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">Bu modul keyingi bosqichda qo&apos;shiladi</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Foydalanuvchilarni qidirish, bloklash va rollarni boshqarish shu yerda bo&apos;ladi.
        </p>
      </Card>
    </div>
  );
}
