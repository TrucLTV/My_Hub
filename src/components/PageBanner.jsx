export default function PageBanner({ title, subtitle }) {
  return (
    <div className="relative -mt-4 flex w-screen mx-[calc(50%-50vw)] flex-col items-center justify-center bg-gradient-to-b from-blue-950 via-blue-950 to-slate-950 px-6 py-12 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
      {subtitle && <p className="mx-auto mt-2 max-w-md text-blue-200/70">{subtitle}</p>}
      <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-amber-500" />
    </div>
  )
}
