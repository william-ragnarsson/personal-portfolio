import ConsoleGreeting from "@/components/ConsoleGreeting";
import FloatingShapes from "@/components/FloatingShapes";
import Hero from "@/components/sections/Hero";
import PlugAndPlay from "@/components/sections/PlugAndPlay";
import Hackathons from "@/components/sections/Hackathons";
import OtherProjects from "@/components/sections/OtherProjects";
import Hardware from "@/components/sections/Hardware";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <ConsoleGreeting />
      <FloatingShapes />
      <main className="relative">
        <Hero />
        <PlugAndPlay />
        <Hackathons />
        <OtherProjects />
        <Hardware />
        <Contact />
      </main>
    </>
  );
}
