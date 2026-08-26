"use client";

import * as React from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setUserRoleAction } from "@/lib/actions/admin-users";

export function RoleSelect({ userId, role }: { userId: string; role: "STUDENT" | "ADMIN" }) {
  const [pending, startTransition] = React.useTransition();
  const [value, setValue] = React.useState(role);

  function handleChange(next: string) {
    startTransition(async () => {
      const result = await setUserRoleAction(userId, next as "STUDENT" | "ADMIN");
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setValue(next as "STUDENT" | "ADMIN");
      toast.success("Đã cập nhật quyền");
    });
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger size="sm" className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="STUDENT">Học viên</SelectItem>
        <SelectItem value="ADMIN">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}
