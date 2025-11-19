import { useEffect, useState } from 'react'

function App() {
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState({})
  const [status, setStatus] = useState('loading...')
  const [placing, setPlacing] = useState(false)
  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const res = await fetch(`${backend}/menu`)
        const data = await res.json()
        const items = Array.isArray(data) ? data : data.items
        setMenu(items || [])
        setStatus('')
      } catch (e) {
        setStatus('Could not load menu.')
      }
    }
    loadMenu()
  }, [backend])

  const addToCart = (item) => {
    setCart((prev) => ({ ...prev, [item.id]: { item, qty: (prev[item.id]?.qty || 0) + 1 } }))
  }

  const removeFromCart = (id) => {
    setCart((prev) => {
      const next = { ...prev }
      if (!next[id]) return prev
      if (next[id].qty <= 1) delete next[id]
      else next[id].qty -= 1
      return next
    })
  }

  const subtotal = Object.values(cart).reduce((sum, v) => sum + v.item.price * v.qty, 0)
  const deliveryFee = subtotal > 0 ? 4.99 : 0
  const total = subtotal + deliveryFee

  const placeOrder = async () => {
    if (subtotal === 0) return
    setPlacing(true)
    try {
      const payload = {
        customer_name: 'Guest',
        customer_phone: '000-000-0000',
        customer_address: '123 Demo Street',
        items: Object.values(cart).map(({ item, qty }) => ({ item_id: item.id, quantity: qty })),
        subtotal,
        delivery_fee: deliveryFee,
        total,
        status: 'pending',
      }
      const res = await fetch(`${backend}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || 'Failed to place order')
      setCart({})
      alert('Order placed! ID: ' + data.id)
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-orange-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-orange-600">BiteNow</div>
          <div className="text-sm text-gray-600">Fast, fresh, delivered</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Menu</h2>
          {status && <p className="text-sm text-red-600 mb-4">{status}</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            {menu.length === 0 && !status && (
              <p className="text-gray-500">No items yet. Add some via the backend /menu endpoint.</p>
            )}
            {menu.map((item) => (
              <div key={item.id || item.name} className="bg-white rounded-xl shadow p-4 border border-orange-100">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-full h-40 object-cover rounded-lg mb-3" />
                )}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <p className="mt-2 font-medium text-orange-600">${item.price?.toFixed(2)}</p>
                  </div>
                  <button
                    disabled={!item.available}
                    onClick={() => addToCart(item)}
                    className="shrink-0 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg"
                  >
                    {item.available ? 'Add' : 'Sold out'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="lg:col-span-1">
          <h2 className="text-2xl font-semibold mb-4">Your Order</h2>
          <div className="bg-white rounded-xl shadow p-4 border border-orange-100 sticky top-20">
            {Object.keys(cart).length === 0 ? (
              <p className="text-gray-500">Your cart is empty.</p>
            ) : (
              <div className="space-y-3">
                {Object.values(cart).map(({ item, qty }) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">${(item.price * qty).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(item.id)} className="px-2 py-1 bg-gray-200 rounded">-</button>
                      <span>{qty}</span>
                      <button onClick={() => addToCart(item)} className="px-2 py-1 bg-gray-200 rounded">+</button>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 text-sm text-gray-700 space-y-1">
                  <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Delivery</span><span>${deliveryFee.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold text-gray-900"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>
                <button
                  onClick={placeOrder}
                  disabled={placing || subtotal === 0}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-2 rounded-lg"
                >
                  {placing ? 'Placing...' : 'Place order'}
                </button>
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="border-t bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600 flex items-center justify-between">
          <span>© {new Date().getFullYear()} BiteNow</span>
          <a className="text-orange-600 underline" href="/test">System status</a>
        </div>
      </footer>
    </div>
  )
}

export default App
