import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  DollarSign, 
  Clock, 
  User, 
  Package,
  Scale,
  Minus,
  Save,
  X,
  AlertCircle,
  Search,
  Calculator,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';
import { RestaurantTable, TableSale, TableSaleItem, TableCartItem } from '../../types/table-sales';
import { PesagemModal } from '../PDV/PesagemModal';

interface TableSalesPanelProps {
  storeId: 1 | 2;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [currentSale, setCurrentSale] = useState<TableSale | null>(null);
  const [cartItems, setCartItems] = useState<TableCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTableForm, setShowNewTableForm] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedWeighableProduct, setSelectedWeighableProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto'>('dinheiro');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  // Check Supabase configuration
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseKey !== 'your_supabase_anon_key_here' &&
                        !supabaseUrl.includes('placeholder');
    
    setSupabaseConfigured(isConfigured);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const fetchTables = async () => {
    try {
      setLoading(true);
      
      if (!supabaseConfigured) {
        // Demo data for when Supabase is not configured
        const demoTables: RestaurantTable[] = [
          {
            id: 'demo-table-1',
            number: 1,
            name: 'Mesa 1',
            capacity: 4,
            status: 'livre',
            location: 'Área interna',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'demo-table-2',
            number: 2,
            name: 'Mesa 2',
            capacity: 2,
            status: 'livre',
            location: 'Área externa',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setTables(demoTables);
        setLoading(false);
        return;
      }

      const tableName = storeId === 1 ? 'store1_tables' : 'store2_tables';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('is_active', true)
        .order('number');

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error('Erro ao carregar mesas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      if (!supabaseConfigured) {
        // Demo products
        const demoProducts = [
          {
            id: 'demo-acai-300',
            code: 'ACAI300',
            name: 'Açaí 300ml',
            category: 'acai',
            is_weighable: false,
            unit_price: 15.90,
            price_per_gram: undefined,
            image_url: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
            is_active: true
          },
          {
            id: 'demo-acai-1kg',
            code: 'ACAI1KG',
            name: 'Açaí 1kg (Pesável)',
            category: 'acai',
            is_weighable: true,
            unit_price: undefined,
            price_per_gram: 0.04499,
            image_url: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
            is_active: true
          }
        ];
        setAvailableProducts(demoProducts);
        return;
      }

      const tableName = storeId === 1 ? 'pdv_products' : 'store2_products';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAvailableProducts(data || []);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    }
  };

  const openTable = async (table: RestaurantTable) => {
    try {
      if (!supabaseConfigured) {
        // Demo mode
        setSelectedTable(table);
        setCurrentSale({
          id: 'demo-sale',
          table_id: table.id,
          sale_number: 1001,
          operator_name: operatorName || 'Operador',
          customer_name: '',
          customer_count: 1,
          subtotal: 0,
          discount_amount: 0,
          total_amount: 0,
          change_amount: 0,
          status: 'aberta',
          opened_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setCartItems([]);
        return;
      }

      const saleTableName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
      
      // Check if table already has an open sale
      if (table.current_sale_id) {
        const { data: existingSale, error } = await supabase
          .from(saleTableName)
          .select('*')
          .eq('id', table.current_sale_id)
          .single();

        if (error) throw error;
        
        setSelectedTable(table);
        setCurrentSale(existingSale);
        setCustomerName(existingSale.customer_name || '');
        setCustomerCount(existingSale.customer_count || 1);
        
        // Load existing items
        const itemsTableName = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';
        const { data: items } = await supabase
          .from(itemsTableName)
          .select('*')
          .eq('sale_id', existingSale.id);

        const cartItems = (items || []).map(item => ({
          product_code: item.product_code,
          product_name: item.product_name,
          quantity: item.quantity,
          weight: item.weight_kg,
          unit_price: item.unit_price,
          price_per_gram: item.price_per_gram,
          subtotal: item.subtotal,
          notes: item.notes
        }));
        
        setCartItems(cartItems);
      } else {
        // Create new sale
        const { data: newSale, error } = await supabase
          .from(saleTableName)
          .insert([{
            table_id: table.id,
            operator_name: operatorName || 'Operador',
            customer_name: '',
            customer_count: 1,
            subtotal: 0,
            discount_amount: 0,
            total_amount: 0,
            status: 'aberta'
          }])
          .select()
          .single();

        if (error) throw error;

        // Update table status
        const tableUpdateName = storeId === 1 ? 'store1_tables' : 'store2_tables';
        await supabase
          .from(tableUpdateName)
          .update({ 
            status: 'ocupada',
            current_sale_id: newSale.id 
          })
          .eq('id', table.id);

        setSelectedTable({ ...table, status: 'ocupada', current_sale_id: newSale.id });
        setCurrentSale(newSale);
        setCartItems([]);
      }
    } catch (err) {
      console.error('Erro ao abrir mesa:', err);
      alert('Erro ao abrir mesa');
    }
  };

  const addProductToCart = (product: any, weight?: number) => {
    const existingIndex = cartItems.findIndex(item => item.product_code === product.code);
    
    let unitPrice = 0;
    let pricePerGram = undefined;
    
    if (product.is_weighable && weight) {
      pricePerGram = product.price_per_gram;
      unitPrice = weight * 1000 * product.price_per_gram; // weight in kg * 1000 * price per gram
    } else {
      unitPrice = product.unit_price || 0;
    }
    
    if (existingIndex >= 0) {
      // Update existing item
      setCartItems(prev => prev.map((item, index) => {
        if (index === existingIndex) {
          const newQuantity = item.quantity + 1;
          const newWeight = weight ? (item.weight || 0) + weight : item.weight;
          let newSubtotal = 0;
          
          if (product.is_weighable && newWeight) {
            newSubtotal = newWeight * 1000 * (product.price_per_gram || 0);
          } else {
            newSubtotal = newQuantity * (product.unit_price || 0);
          }
          
          return {
            ...item,
            quantity: newQuantity,
            weight: newWeight,
            subtotal: newSubtotal
          };
        }
        return item;
      }));
    } else {
      // Add new item
      const newItem: TableCartItem = {
        product_code: product.code,
        product_name: product.name,
        quantity: 1,
        weight: weight,
        unit_price: product.is_weighable ? undefined : product.unit_price,
        price_per_gram: product.is_weighable ? product.price_per_gram : undefined,
        subtotal: unitPrice,
        notes: ''
      };
      setCartItems(prev => [...prev, newItem]);
    }
    
    setShowProductSearch(false);
    setSearchTerm('');
  };

  const handleProductClick = (product: any) => {
    if (product.is_weighable) {
      setSelectedWeighableProduct(product);
      setShowWeightModal(true);
    } else {
      addProductToCart(product);
    }
  };

  const handleWeightConfirm = (weightInGrams: number) => {
    if (selectedWeighableProduct && weightInGrams > 0) {
      const weightInKg = weightInGrams / 1000;
      addProductToCart(selectedWeighableProduct, weightInKg);
    }
    setShowWeightModal(false);
    setSelectedWeighableProduct(null);
  };

  const removeFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }

    setCartItems(prev => prev.map((item, i) => {
      if (i === index) {
        let newSubtotal = 0;
        if (item.price_per_gram && item.weight) {
          newSubtotal = item.weight * 1000 * item.price_per_gram;
        } else {
          newSubtotal = quantity * (item.unit_price || 0);
        }
        
        return {
          ...item,
          quantity,
          subtotal: newSubtotal
        };
      }
      return item;
    }));
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.subtotal, 0);
  };

  const finalizeSale = async () => {
    if (!currentSale || cartItems.length === 0) return;

    try {
      if (!supabaseConfigured) {
        alert('Venda finalizada com sucesso! (Modo demonstração)');
        closeTable();
        return;
      }

      const total = getCartTotal();
      
      // Update sale
      const saleTableName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
      await supabase
        .from(saleTableName)
        .update({
          customer_name: customerName,
          customer_count: customerCount,
          subtotal: total,
          total_amount: total,
          payment_type: paymentMethod,
          change_amount: changeFor || 0,
          status: 'fechada',
          closed_at: new Date().toISOString()
        })
        .eq('id', currentSale.id);

      // Add items
      const itemsTableName = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';
      const saleItems = cartItems.map(item => ({
        sale_id: currentSale.id,
        product_code: item.product_code,
        product_name: item.product_name,
        quantity: item.quantity,
        weight_kg: item.weight,
        unit_price: item.unit_price,
        price_per_gram: item.price_per_gram,
        discount_amount: 0,
        subtotal: item.subtotal,
        notes: item.notes
      }));

      await supabase
        .from(itemsTableName)
        .insert(saleItems);

      alert('Venda finalizada com sucesso!');
      closeTable();
    } catch (err) {
      console.error('Erro ao finalizar venda:', err);
      alert('Erro ao finalizar venda');
    }
  };

  const closeTable = async () => {
    if (!selectedTable) return;

    try {
      if (!supabaseConfigured) {
        setSelectedTable(null);
        setCurrentSale(null);
        setCartItems([]);
        setCustomerName('');
        setCustomerCount(1);
        return;
      }

      const tableUpdateName = storeId === 1 ? 'store1_tables' : 'store2_tables';
      await supabase
        .from(tableUpdateName)
        .update({ 
          status: 'livre',
          current_sale_id: null 
        })
        .eq('id', selectedTable.id);

      setSelectedTable(null);
      setCurrentSale(null);
      setCartItems([]);
      setCustomerName('');
      setCustomerCount(1);
      fetchTables();
    } catch (err) {
      console.error('Erro ao fechar mesa:', err);
      alert('Erro ao fechar mesa');
    }
  };

  const filteredProducts = searchTerm
    ? availableProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableProducts;

  useEffect(() => {
    fetchTables();
    fetchProducts();
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando mesas da Loja {storeId}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Supabase Configuration Warning */}
      {!supabaseConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 md:p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-800 text-sm md:text-base">Modo Demonstração</h3>
              <p className="text-yellow-700 text-xs md:text-sm">
                Supabase não configurado. Funcionalidades limitadas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users size={20} md:size={24} className="text-indigo-600" />
            Vendas de Mesas - Loja {storeId}
          </h2>
          <p className="text-sm md:text-base text-gray-600">Gerencie vendas presenciais por mesa</p>
        </div>
        <button
          onClick={() => setShowNewTableForm(true)}
          className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
        >
          <Plus size={16} md:size={20} />
          Nova Mesa
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 md:p-4">
          <p className="text-red-600 text-sm md:text-base">{error}</p>
        </div>
      )}

      {/* Tables Grid - Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            onClick={() => openTable(table)}
            className={`p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
              table.status === 'livre'
                ? 'bg-green-50 border-green-200 hover:border-green-300'
                : table.status === 'ocupada'
                ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
                : 'bg-red-50 border-red-200 hover:border-red-300'
            }`}
          >
            <div className="text-center">
              <div className={`w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                table.status === 'livre' ? 'bg-green-100' : 
                table.status === 'ocupada' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <Users size={16} md:size={20} className={
                  table.status === 'livre' ? 'text-green-600' : 
                  table.status === 'ocupada' ? 'text-yellow-600' : 'text-red-600'
                } />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm md:text-base">{table.name}</h3>
              <p className="text-xs md:text-sm text-gray-600">Cap: {table.capacity}</p>
              <p className={`text-xs font-medium mt-1 ${
                table.status === 'livre' ? 'text-green-600' : 
                table.status === 'ocupada' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {table.status === 'livre' ? 'Livre' : 
                 table.status === 'ocupada' ? 'Ocupada' : 'Aguardando'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-8 md:py-12">
          <Users size={32} md:size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-sm md:text-base">Nenhuma mesa cadastrada</p>
        </div>
      )}

      {/* Sale Modal - Responsive */}
      {selectedTable && currentSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-3 md:p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                    {selectedTable.name} - Venda #{currentSale.sale_number}
                  </h2>
                  <p className="text-sm md:text-base text-gray-600">Loja {storeId}</p>
                </div>
                <button
                  onClick={closeTable}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content - Responsive Layout */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Left Side - Customer Info & Cart */}
              <div className="flex-1 p-3 md:p-6 overflow-y-auto">
                {/* Customer Info */}
                <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Cliente
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
                        placeholder="Nome do cliente"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Pessoas
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={customerCount}
                        onChange={(e) => setCustomerCount(parseInt(e.target.value) || 1)}
                        className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Add Product Button */}
                <div className="mb-4 md:mb-6">
                  <button
                    onClick={() => setShowProductSearch(true)}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white p-3 md:p-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    <Plus size={16} md:size={20} />
                    Adicionar Produto
                  </button>
                </div>

                {/* Cart Items */}
                <div className="space-y-3 mb-4 md:mb-6">
                  <h3 className="font-semibold text-gray-800 text-sm md:text-base">Itens do Pedido</h3>
                  {cartItems.length === 0 ? (
                    <div className="text-center py-6 md:py-8">
                      <Package size={24} md:size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm md:text-base">Nenhum item adicionado</p>
                    </div>
                  ) : (
                    <div className="space-y-2 md:space-y-3 max-h-48 md:max-h-64 overflow-y-auto">
                      {cartItems.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3 md:p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-800 text-sm md:text-base truncate">
                                {item.product_name}
                              </h4>
                              {item.weight && (
                                <p className="text-xs md:text-sm text-gray-600">
                                  Peso: {(item.weight * 1000).toFixed(0)}g
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => removeFromCart(index)}
                              className="text-red-500 hover:text-red-700 p-1 ml-2"
                            >
                              <Trash2 size={14} md:size={16} />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                className="bg-gray-200 hover:bg-gray-300 rounded-full p-1"
                              >
                                <Minus size={12} md:size={14} />
                              </button>
                              <span className="font-medium w-6 md:w-8 text-center text-sm md:text-base">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                className="bg-gray-200 hover:bg-gray-300 rounded-full p-1"
                              >
                                <Plus size={12} md:size={14} />
                              </button>
                            </div>
                            <div className="font-bold text-indigo-600 text-sm md:text-base">
                              {formatPrice(item.subtotal)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Method - Mobile Optimized */}
                {cartItems.length > 0 && (
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Forma de Pagamento
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
                        <label className="flex items-center gap-2 p-2 md:p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name="payment"
                            value="dinheiro"
                            checked={paymentMethod === 'dinheiro'}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                            className="text-indigo-600"
                          />
                          <Banknote size={16} md:size={20} className="text-green-600" />
                          <span className="text-sm md:text-base font-medium">Dinheiro</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 md:p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name="payment"
                            value="pix"
                            checked={paymentMethod === 'pix'}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                            className="text-indigo-600"
                          />
                          <QrCode size={16} md:size={20} className="text-blue-600" />
                          <span className="text-sm md:text-base font-medium">PIX</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 md:p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name="payment"
                            value="cartao_credito"
                            checked={paymentMethod === 'cartao_credito'}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                            className="text-indigo-600"
                          />
                          <CreditCard size={16} md:size={20} className="text-purple-600" />
                          <span className="text-sm md:text-base font-medium">Cartão</span>
                        </label>
                      </div>
                    </div>

                    {paymentMethod === 'dinheiro' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Troco para quanto?
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={changeFor || ''}
                          onChange={(e) => setChangeFor(parseFloat(e.target.value) || undefined)}
                          className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
                          placeholder="Valor para troco"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side - Total & Actions */}
              <div className="lg:w-80 bg-gray-50 p-3 md:p-6 border-t lg:border-t-0 lg:border-l border-gray-200 flex-shrink-0">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm md:text-base text-gray-600">Total da Venda</p>
                    <p className="text-xl md:text-2xl font-bold text-indigo-600">
                      {formatPrice(getCartTotal())}
                    </p>
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    <button
                      onClick={finalizeSale}
                      disabled={cartItems.length === 0}
                      className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-2 md:py-3 rounded-lg font-semibold transition-colors text-sm md:text-base"
                    >
                      Finalizar Venda
                    </button>
                    
                    <button
                      onClick={closeTable}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 md:py-3 rounded-lg font-medium transition-colors text-sm md:text-base"
                    >
                      Fechar Mesa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Search Modal - Mobile Optimized */}
      {showProductSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-3 md:p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">Adicionar Produto</h2>
                <button
                  onClick={() => {
                    setShowProductSearch(false);
                    setSearchTerm('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="relative">
                <Search size={16} md:size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar produtos..."
                  className="w-full pl-8 md:pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="bg-gray-50 rounded-lg p-3 md:p-4 cursor-pointer hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-indigo-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package size={16} md:size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 text-sm md:text-base truncate">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          {product.is_weighable ? (
                            <div className="flex items-center gap-1 text-indigo-600 font-bold text-xs md:text-sm">
                              <Scale size={12} md:size={14} />
                              {formatPrice((product.price_per_gram || 0) * 1000)}/kg
                            </div>
                          ) : (
                            <div className="font-bold text-indigo-600 text-xs md:text-sm">
                              {formatPrice(product.unit_price || 0)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-6 md:py-8">
                  <Package size={24} md:size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm md:text-base">Nenhum produto encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Weight Modal */}
      {showWeightModal && selectedWeighableProduct && (
        <PesagemModal
          produto={selectedWeighableProduct}
          onConfirmar={handleWeightConfirm}
          onFechar={() => {
            setShowWeightModal(false);
            setSelectedWeighableProduct(null);
          }}
          useDirectScale={true}
        />
      )}

      {/* New Table Form Modal - Mobile Optimized */}
      {showNewTableForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">Nova Mesa</h2>
                <button
                  onClick={() => setShowNewTableForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número da Mesa
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
                  placeholder="Ex: 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Mesa
                </label>
                <input
                  type="text"
                  className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
                  placeholder="Ex: Mesa 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidade
                </label>
                <input
                  type="number"
                  min="1"
                  defaultValue="4"
                  className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
                />
              </div>

              <div className="flex gap-2 md:gap-3 pt-2">
                <button
                  onClick={() => setShowNewTableForm(false)}
                  className="flex-1 px-4 py-2 md:py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm md:text-base"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement create table
                    setShowNewTableForm(false);
                    alert('Funcionalidade em desenvolvimento');
                  }}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base"
                >
                  Criar Mesa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;