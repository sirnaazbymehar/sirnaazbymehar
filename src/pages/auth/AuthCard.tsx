import type { ReactNode } from 'react'
import Ornament from '../../components/ui/Ornament'

export default function AuthCard({ title, sub, children, footer }: { title: string; sub?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="container-x flex justify-center py-12 sm:py-20">
      <div className="flex w-full max-w-md flex-col gap-6 bg-sand/60 p-6 sm:p-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-display text-[34px] leading-tight sm:text-[40px]">{title}</h1>
          <Ornament />
          {sub && <p className="text-[14px] text-ink-soft">{sub}</p>}
        </div>
        {children}
        {footer && <div className="border-t border-line pt-5 text-center text-[13.5px] text-ink-soft">{footer}</div>}
      </div>
    </section>
  )
}

export function FormError({ message }: { message: string }) {
  if (!message) return null
  return <p role="alert" className="border-l-2 border-wine bg-ivory px-3 py-2 text-[13.5px] text-wine">{message}</p>
}
