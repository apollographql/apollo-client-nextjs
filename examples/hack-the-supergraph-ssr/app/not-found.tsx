"use client";

import Button from "../components/Button";
import React from "react";
import Error from "./error";
import Link from "next/link";

export const Fallback = () => (
  <Error code="404" error="This page could not be found">
    <Button as={Link} href="/">
      Home
    </Button>
  </Error>
);

export default Fallback;
