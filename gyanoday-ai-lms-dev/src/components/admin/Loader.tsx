interface LoaderProps {
  size?: string
}

export default function Loader({ size = 'h-8 w-8' }: LoaderProps) {
  return (
    <div className="flex items-center justify-center">
      <div
        className={`${size} animate-spin rounded-full border-4 border-solid border-primary border-t-transparent`}
      ></div>
    </div>
  )
}
