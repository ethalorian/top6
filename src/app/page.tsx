"use client"

import { Top6Layout } from "@/components/Top6Layout";
import { Top6Provider } from "@/providers/Top6Provider";

export default function Top6Page() {
  return (
    <Top6Provider>
      <Top6Layout />
    </Top6Provider>
  );
}

