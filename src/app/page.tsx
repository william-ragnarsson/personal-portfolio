import ConsoleGreeting from "@/components/ConsoleGreeting";
import Cursor from "@/components/Cursor";
import PageTone from "@/components/PageTone";
import Contact from "@/components/contact/Contact";
import Hackathons from "@/components/sections/Hackathons";
import Hero from "@/components/sections/Hero";
import Nyc from "@/components/sections/Nyc";
import PlugAndPlay from "@/components/sections/PlugAndPlay";
import Projects from "@/components/sections/Projects";
import Tunebox from "@/components/sections/Tunebox";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Tunebox />
        <PlugAndPlay />
        <Hackathons />
        <Projects />
        <Nyc />
        <Contact />
      </main>
      <div className="grain" aria-hidden />
      <Cursor />
      <PageTone />
      <ConsoleGreeting />
    </>
  );
}
