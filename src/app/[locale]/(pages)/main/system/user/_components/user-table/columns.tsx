"use client";

import TableAction from "@/components/table/table-action";
import { Button } from "@/components/ui/button";
import { type User } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import { type UserModalRefType } from "../user-dialog";

export const createColumns = (
  openDialog: UserModalRefType["setModel"],
  deleteUser: (id: string) => void,
): ColumnDef<Omit<User, "password">>[] => {
  return [
    {
      accessorKey: "username",
      header: "用户名",
      cell: ({ row }) => (
        <Button
          variant="link"
          onClick={() =>
            openDialog(true, "view", row.original)
          }
        >
          {row.getValue("username")}
        </Button>
      ),
    },
    {
      header: "邮箱",
      accessorKey: "email",
    },
    {
      header: "头像",
      accessorKey: "image",
    },
    {
      header: "操作",
      accessorKey: "action",
      cell: ({ row }) => (
        <TableAction
          row={row}
          actions={[
            {
              title: "删除",
              disabled: !row.original.editable,
              action: () => {
                deleteUser(row.original.id);
              },
            },
            {
              title: "编辑",
              disabled: !row.original.editable,
              action: () =>
                openDialog(true, "edit", row.original),
            },
          ]}
        />
      ),
    },
  ];
};
