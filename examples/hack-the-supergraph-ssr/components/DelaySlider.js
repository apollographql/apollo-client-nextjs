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
import { byEnv } from "@/../../package/dist";

export default function DelaySlider() {
  const [delay, setDelay] = useState(
    byEnv({
      Browser: () => Number(clientCookies.get("apollo-x-custom-delay") ?? 1000),
      default: null,
    })
  );
  useEffect(() => {
    clientCookies.set("apollo-x-custom-delay", delay);
  }, [delay]);
  // render only on the client
  if (delay === null) return null;
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
