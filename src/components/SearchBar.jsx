import { Input } from '@/components/ui/input'

export default function SearchBar({ value, onChange, placeholder = 'Tìm kiếm...' }) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="max-w-sm"
    />
  )
}
