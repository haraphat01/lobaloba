import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="container-x grid min-h-[70vh] items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
      <div className="hidden max-w-xl lg:block">
        <p className="eyebrow flex items-center gap-3 text-wine"><span className="h-px w-7 bg-gold" />A more personal experience</p>
        <h2 className="mt-5 text-6xl leading-[0.98] font-normal text-wine xl:text-7xl">Your moments,<br /><span className="italic text-gold">beautifully kept.</span></h2>
        <p className="mt-6 max-w-md text-base leading-7 text-charcoal/75">Keep your orders, saved addresses and favourite pieces together in one place.</p>
      </div>
      <div className="mx-auto w-full max-w-lg rounded-sm border border-border bg-[#fffdf9] p-6 shadow-[0_20px_70px_-45px_rgba(74,18,32,0.28)] sm:p-10">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        {children}
      </div>
    </div>
  );
}
