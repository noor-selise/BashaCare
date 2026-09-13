export const formatTaka = (amount: number) => {
  return `৳${new Intl.NumberFormat("en-BD").format(amount)}`
}
