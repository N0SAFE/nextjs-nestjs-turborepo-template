'use client'

import { withLayout } from '@/routes/makeRoute'
import { RootLayout } from '../layout'

// Demo page showing how to use innerState function with withLayout
// The innerState function is called inside the component to access provider context
const DemoPage = withLayout(RootLayout)(function DemoPage({ layoutData }) {
    // Call the innerState function to get the context data
    // This works because we're below the providers (NextAuthProviders, ReactQueryProviders, etc.)
    const sessionData = layoutData.innerState()
    
    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-4">Inner State Demo</h1>
            
            <div className="space-y-4">
                <section className="border rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-2">Layout Data (Static)</h2>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto">
                        {JSON.stringify(
                            {
                                appName: layoutData.data.appName,
                                version: layoutData.data.version,
                                metadata: layoutData.data.metadata,
                            },
                            null,
                            2
                        )}
                    </pre>
                </section>
                
                <section className="border rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-2">Session Data (Dynamic - from innerState function)</h2>
                    <p className="text-sm text-gray-600 mb-2">
                        This data is retrieved by calling <code>layoutData.innerState()</code> inside the component,
                        allowing access to React Context like useSession() from Better Auth
                    </p>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto">
                        {JSON.stringify(sessionData, null, 2)}
                    </pre>
                </section>
                
                <section className="border rounded-lg p-4 bg-blue-50">
                    <h2 className="text-xl font-semibold mb-2">How it works</h2>
                    <ol className="list-decimal list-inside space-y-2">
                        <li>
                            <code>innerState</code> is defined as a <strong>function</strong> in the layout
                        </li>
                        <li>
                            The function is passed down through <code>layoutData.innerState</code>
                        </li>
                        <li>
                            Child components call <code>layoutData.innerState()</code> to access provider context
                        </li>
                        <li>
                            This allows using hooks like <code>useSession()</code>, <code>useQuery()</code>, etc.
                        </li>
                    </ol>
                </section>
            </div>
        </div>
    )
})

export default DemoPage
