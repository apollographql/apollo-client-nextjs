"use client";

import Button from "../components/Button";
import React from "react";
import Error from "./error";
import Link from "next/link";

export const Fallback = () => (
  <div>hi</div>
  // <Error error={new Error("This page could not be found")} />
);

export default Fallback;
