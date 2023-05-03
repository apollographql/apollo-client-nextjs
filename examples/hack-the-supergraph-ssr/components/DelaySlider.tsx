import {
  Box,
  Heading,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import clientCookies from "js-cookie";

export default function DelaySlider() {
  const [delay, setDelay] = useState(
    typeof window === "undefined"
      ? 1000
      : Number(clientCookies.get("apollo-x-custom-delay") ?? 1000)
  );

  useEffect(() => {
    if (delay) clientCookies.set("apollo-x-custom-delay", String(delay));
  }, [delay]);

  return (
    <Box>
      <Heading fontSize="md">
        Custom <code>@defer</code> Delay: {delay}ms
      </Heading>
      <Slider min={0} max={500} value={delay} onChange={setDelay}>
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </Box>
  );
}
