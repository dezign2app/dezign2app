import * as React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@workspace/ui/components/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@workspace/ui/components/dropdown-menu";

export type ActionMenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  variant?: "default" | "destructive";
  shortcut?: string;
  disabled?: boolean;
};

export type ActionMenuSeparator = {
  isSeparator: true;
};

export type ActionMenuProps = {
  children: React.ReactNode;
  trigger?: React.ReactNode;
  items: (ActionMenuItem | ActionMenuSeparator)[];
  contentClassName?: string;
  dropdownAlign?: "start" | "center" | "end";
  dropdownSideOffset?: number;
};

export function ActionMenu({
  children,
  trigger,
  items,
  contentClassName,
  dropdownAlign = "start",
  dropdownSideOffset = 4,
}: ActionMenuProps) {
  // Render the menu items based on whether it's a context or dropdown menu
  const renderContextMenuItems = () =>
    items.map((item, index) => {
      if ("isSeparator" in item) {
        return <ContextMenuSeparator key={`sep-${index}`} />;
      }
      return (
        <ContextMenuItem
          key={item.label}
          variant={item.variant}
          disabled={item.disabled}
          onClick={(e) => {
            e.stopPropagation();
            item.onClick?.(e);
          }}
          className="gap-3"
        >
          {item.icon}
          {item.label}
          {/* We could add shortcuts here if we extend the type */}
        </ContextMenuItem>
      );
    });

  const renderDropdownMenuItems = () =>
    items.map((item, index) => {
      if ("isSeparator" in item) {
        return <DropdownMenuSeparator key={`sep-${index}`} />;
      }
      return (
        <DropdownMenuItem
          key={item.label}
          variant={item.variant}
          disabled={item.disabled}
          onClick={(e) => {
            e.stopPropagation();
            item.onClick?.(e);
          }}
          className="gap-3"
        >
          {item.icon}
          {item.label}
        </DropdownMenuItem>
      );
    });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className={contentClassName}>
        {renderContextMenuItems()}
      </ContextMenuContent>

      {/* Conditionally render DropdownMenu if trigger is provided */}
      {trigger && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          <DropdownMenuContent
            align={dropdownAlign}
            sideOffset={dropdownSideOffset}
            className={contentClassName}
          >
            {renderDropdownMenuItems()}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </ContextMenu>
  );
}
