"use client";

import Link from "next/link";

export default function Page() {
  // lambdaで、Todoが削除されたらログインしているユーザにメールを送信する

  return (
    <>
      <Link href={"/todo"}>go to todo page</Link>
    </>
  );
}
