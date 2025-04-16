"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { getTimezone } from "@/lib/timezone";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TimezoneToggle() {
  const timezone = getTimezone();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Clock className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Show timezone</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="cursor-default">{timezone}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 