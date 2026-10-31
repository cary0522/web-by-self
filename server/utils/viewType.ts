export function viewTypeRequiresPage(viewTypeName: string): boolean {
    const normalizedName = viewTypeName.toLowerCase()
    return normalizedName === 'page' || normalizedName === 'pdf' || normalizedName === 'home'
}
