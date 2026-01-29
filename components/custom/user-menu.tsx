"use client";

import Link from "next/link";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

export const UserMenu = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <>
            <SignedIn>
                <UserButton
                    showName
                    afterSignOutUrl="/sign-in"
                />
            </SignedIn>
            <SignedOut>
                <Button className="py-1.5 px-2 h-fit font-normal text-white" asChild>
                    <Link href="/sign-in">Login</Link>
                </Button>
            </SignedOut>
        </>
    );
};
