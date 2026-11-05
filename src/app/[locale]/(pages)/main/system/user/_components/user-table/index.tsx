"use client";

import { reload } from "@/app/actions";
import { api } from "@/trpc/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createColumns } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/table/data-table";
import UserDialog, { type UserModalRefType } from "../user-dialog";
import { type User } from "@prisma/client";

interface UserTableProps {
  list: Omit<User, "password">[];
  total: number;
}
function UserTable(params: UserTableProps) {
  const { list, total } = params;
  const pathName = usePathname();
  const [userModal, setUserModal] = useState<UserModalRefType | null>(null);

  const userDeleteApi = api.user.deleteUserById.useMutation({
    onSuccess() {
      reloadList();
    },
  });
  const deleteUser = (id: string) => {
    userDeleteApi.mutate({ id });
  };

  const reloadList = () => {
    reload(pathName);
  };
  const openDialog: UserModalRefType["setModel"] = (...args) => userModal?.setModel(...args);
  const columns = createColumns(openDialog, deleteUser);
  return (
    <>
      <div className="flex items-start justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => userModal?.setModel(true, "add")}
        >
          <Plus className="mr-2 h-4 w-4" /> 新增用户
        </Button>
      </div>
      <Separator className="mb-4 mt-4" />
      <DataTable columns={columns} data={list} totalItems={total} />
      <UserDialog ref={setUserModal} reloadList={reloadList} />
    </>
  );
}

export default UserTable;
