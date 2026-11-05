"use client";
import { DataTable } from "@/components/table/data-table";
import React, { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoleDialog, { type RoleModalRefType } from "../role-dialog";
import { type Role } from "@prisma/client";
import { createColumns } from "./columns";
import { api } from "@/trpc/react";
import { usePathname } from "next/navigation";
import { reload } from "@/app/actions";
interface RoleTableProps {
  list: Role[];
  total: number;
}
function RoleTable(params: RoleTableProps) {
  const { list, total } = params;
  const pathName = usePathname();
  const [roleModal, setRoleModal] = useState<RoleModalRefType | null>(null);

  const roleDeleteApi = api.role.deleteRoleById.useMutation({
    onSuccess() {
      reloadList();
    },
  });
  const deleteRole = (id: string) => {
    roleDeleteApi.mutate({ id });
  };

  const reloadList = () => {
    reload(pathName);
  };
  const openDialog: RoleModalRefType["setModel"] = (...args) => roleModal?.setModel(...args);
  const columns = createColumns(openDialog, deleteRole);
  return (
    <>
      <div className="flex items-start justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => roleModal?.setModel(true, "add")}
        >
          <Plus className="mr-2 h-4 w-4" /> 新增角色
        </Button>
      </div>
      <Separator className="mb-4 mt-4" />
      <DataTable columns={columns} data={list} totalItems={total} />
      <RoleDialog ref={setRoleModal} reloadList={reloadList} />
    </>
  );
}

export default RoleTable;
