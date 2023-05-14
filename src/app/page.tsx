import dynamic from "next/dynamic";

export default function Home() {
  return (
    <Interactive aspectRatio={554 / 397} allowFullscreen={true}></Interactive>
  );
}

const Interactive = dynamic(() => import("./Interactive"), {
  ssr: false,
});
