"use client";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { type Menu } from "@prisma/client";
import { Plus } from "lucide-react";
import React, { useState } from "react";
import { createColumns } from "./columns";
import { api } from "@/trpc/react";
import { reload } from "@/app/actions";
import { usePathname } from "next/navigation";
import MenuDialog, { type MenuDialogRefType } from "../menu-dialog";
interface MenuTableProps {
  list: Menu[];
  total: number;
}
function MenuTable(params: MenuTableProps) {
  const { list, total } = params;
  const pathName = usePathname();
  const [menuDialog, setMenuDialog] = useState<MenuDialogRefType | null>(null);
  const menuDeleteApi = api.menu.deleteMenuById.useMutation({
    onSuccess() {
      reloadList();
    },
  });

  const reloadList = () => {
    reload(pathName);
  };
  const deleteMenu = (key: string) => {
    menuDeleteApi.mutate({ key });
  };
  const openDialog: MenuDialogRefType["setModel"] = (...args) => menuDialog?.setModel(...args);
  const columns = createColumns(openDialog, deleteMenu);
  return (
    <div>
      <div className="flex items-start justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            menuDialog?.setModel(true, "add");
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> 新增菜单
        </Button>
      </div>
      <Separator className="mb-4 mt-4" />
      <DataTable columns={columns} data={list} totalItems={total} />
      <MenuDialog ref={setMenuDialog} reloadList={reloadList} />
    </div>
  );
}

export default MenuTable;
