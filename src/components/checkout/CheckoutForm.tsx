import type { Address } from '../../types'

export const indianStates = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

export const emptyAddress: Address = { fullName: '', mobile: '', email: '', house: '', address: '', area: '', city: '', state: '', pincode: '', country: 'India' }

export type Errors = Partial<Record<keyof Address, string>>

export function validate(a: Address): Errors {
  const e: Errors = {}
  if (a.fullName.trim().length < 2) e.fullName = 'Enter your full name'
  if (!/^[6-9]\d{9}$/.test(a.mobile.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, ''))) e.mobile = 'Enter a valid 10-digit mobile number'
  if (!/^\S+@\S+\.\S+$/.test(a.email)) e.email = 'Enter a valid email address'
  if (!a.house.trim()) e.house = 'Enter your flat or house number'
  if (a.address.trim().length < 4) e.address = 'Enter your street address'
  if (!a.city.trim()) e.city = 'Enter your city'
  if (!a.state) e.state = 'Choose your state'
  if (!/^[1-9]\d{5}$/.test(a.pincode)) e.pincode = 'Enter a valid 6-digit pincode'
  return e
}

interface Props { value: Address; onChange: (a: Address) => void; errors: Errors; hideEmail?: boolean }

export default function CheckoutForm({ value, onChange, errors, hideEmail = false }: Props) {
  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [k]: e.target.value })
  const F = ({ k, label, className = '', ...rest }: { k: keyof Address; label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className={`field ${className}`}>
      <label htmlFor={`co-${k}`}>{label}</label>
      <input id={`co-${k}`} value={value[k]} onChange={set(k)} className={`input ${errors[k] ? 'input-error' : ''}`} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `co-${k}-err` : undefined} {...rest} />
      {errors[k] && <span id={`co-${k}-err`} className="text-[12.5px] text-wine">{errors[k]}</span>}
    </div>
  )
  return (
    <div className="flex flex-col gap-10">
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 font-display text-[26px]">Contact</legend>
        {F({ k: 'fullName', label: 'Full name', autoComplete: 'name' })}
        <div className="grid gap-4 sm:grid-cols-2">
          {F({ k: 'mobile', label: 'Mobile number', type: 'tel', inputMode: 'numeric', autoComplete: 'tel', placeholder: '10-digit mobile' })}
          {!hideEmail && F({ k: 'email', label: 'Email address', type: 'email', autoComplete: 'email' })}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 font-display text-[26px]">Delivery address</legend>
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          {F({ k: 'house', label: 'Apartment / House no.', autoComplete: 'address-line1' })}
          {F({ k: 'address', label: 'Address', autoComplete: 'address-line2', placeholder: 'Street, building, landmark' })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {F({ k: 'area', label: 'Area / Locality' })}
          {F({ k: 'city', label: 'City', autoComplete: 'address-level2' })}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="field">
            <label htmlFor="co-state">State</label>
            <select id="co-state" value={value.state} onChange={set('state')} className={`input ${errors.state ? 'input-error' : ''}`} aria-invalid={!!errors.state}>
              <option value="">Select state</option>
              {indianStates.map((s) => <option key={s}>{s}</option>)}
            </select>
            {errors.state && <span className="text-[12.5px] text-wine">{errors.state}</span>}
          </div>
          {F({ k: 'pincode', label: 'Pincode', inputMode: 'numeric', maxLength: 6, autoComplete: 'postal-code' })}
          {F({ k: 'country', label: 'Country', readOnly: true, className: 'opacity-80' })}
        </div>
      </fieldset>
    </div>
  )
}
