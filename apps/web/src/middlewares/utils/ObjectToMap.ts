export default function ObjectToMap<T>(obj: Record<string, T>): Map<string, T> {
    return new Map(Object.entries(obj))
}
