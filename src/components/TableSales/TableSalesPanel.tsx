import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RestaurantTable, TableSale, TableSaleItem, TableCartItem } from '../../types/table-sales';
import { PDVProduct } from '../../types/pdv';
import WeightInputModal from '../PDV/WeightInputModal';
import { 
  Users, 
  Plus, 
  Minus, 
  Search, 
  Package, 
  Scale, 
  ShoppingCart, 
  Trash2, 
  DollarSign,
  Clock,
  User,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface TableSalesPanelProps {
  storeId: number;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [products, setProducts] = useState<PDVProduct[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [currentSale, setCurrentSale] = useState<TableSale | null>(null);
  const [cartItems, setCartItems] = useState<TableCartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [paymentType, setPaymentType] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto'>('dinheiro');
  const [changeAmount, setChangeAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  
  // Estados para pesagem
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [selectedWeighableProduct, setSelectedWeighableProduct] = useState<PDVProduct | null>(null);

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

  const getTableName = (storeId: number) => {
    return storeId === 1 ? 'store1_tables' : 'store2_tables';
  };

  const getSaleName = (storeId: number) => {
    return storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
  };

  const getSaleItemsName = (storeId: number) => {
    return storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';
  };

  const getProductsName = (storeId: number) => {
    return storeId === 1 ? 'pdv_products' : 'store2_products';
  };

  const fetchTables = async () => {
    try {
      if (!supabaseConfigured) {
        // Dados de demonstração
        const demoTables: RestaurantTable[] = [
          {
            id: 'demo-table-1',
            number: 1,
            name: 'Mesa 1',
            capacity: 4,
            status: 'livre',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'demo-table-2',
            number: 2,
            name: 'Mesa 2',
            capacity: 6,
            status: 'livre',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setTables(demoTables);
        return;
      }

      const { data, error } = await supabase
        .from(getTableName(storeId))
        .select(`
          *,
          current_sale:${getSaleName(storeId)}(*)
        `)
        .eq('is_active', true)
        .order('number');

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      if (!supabaseConfigured) {
        // Produtos de demonstração
        const demoProducts: PDVProduct[] = [
          {
            id: 'demo-acai-300',
            code: 'ACAI300',
            name: 'Açaí 300ml',
            category: 'acai',
            is_weighable: false,
            unit_price: 15.90,
            stock_quantity: 100,
            min_stock: 10,
            is_active: true,
            description: 'Açaí tradicional 300ml',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'demo-acai-1kg',
            code: 'ACAI1KG',
            name: 'Açaí 1kg (Pesável)',
            category: 'acai',
            is_weighable: true,
            price_per_gram: 0.04499,
            stock_quantity: 50,
            min_stock: 5,
            is_active: true,
            description: 'Açaí tradicional vendido por peso',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setProducts(demoProducts);
        return;
      }

      const { data, error } = await supabase
        .from(getProductsName(storeId))
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const handleProductClick = (product: PDVProduct) => {
    if (product.is_weighable) {
      // Para produtos pesáveis, abrir modal de pesagem
      setSelectedWeighableProduct(product);
      setShowWeightInput(true);
    } else {
      // Para produtos unitários, adicionar diretamente
      addProductToCart(product, 1);
    }
  };

  const handleWeightConfirm = (weightInKg: number) => {
    if (selectedWeighableProduct && weightInKg > 0) {
      addProductToCart(selectedWeighableProduct, 1, weightInKg);
    }
    setShowWeightInput(false);
    setSelectedWeighableProduct(null);
  };

  const addProductToCart = (product: PDVProduct, quantity: number = 1, weight?: number) => {
    const existingIndex = cartItems.findIndex(item => item.product_code === product.code);
    
    if (existingIndex >= 0) {
      // Atualizar item existente
      setCartItems(prev => prev.map((item, index) => {
        if (index === existingIndex) {
          const newQuantity = item.quantity + quantity;
          const newWeight = weight ? (item.weight || 0) + weight : item.weight;
          return {
            ...item,
            quantity: newQuantity,
            weight: newWeight,
            subtotal: calculateItemSubtotal(product, newQuantity, newWeight)
          };
        }
        return item;
      }));
    } else {
      // Adicionar novo item
      const newItem: TableCartItem = {
        product_code: product.code,
        product_name: product.name,
        quantity,
        weight,
        unit_price: product.unit_price,
        price_per_gram: product.price_per_gram,
        subtotal: calculateItemSubtotal(product, quantity, weight),
        notes: ''
      };
      setCartItems(prev => [...prev, newItem]);
    }
  };

  const calculateItemSubtotal = (product: PDVProduct, quantity: number, weight?: number): number => {
    if (product.is_weighable && weight && product.price_per_gram) {
      return weight * 1000 * product.price_per_gram; // peso em kg * 1000 * preço por grama
    } else if (!product.is_weighable && product.unit_price) {
      return quantity * product.unit_price;
    }
    return 0;
  };

  const removeFromCart = (productCode: string) => {
    setCartItems(prev => prev.filter(item => item.product_code !== productCode));
  };

  const updateCartItemQuantity = (productCode: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productCode);
      return;
    }

    setCartItems(prev => prev.map(item => {
      if (item.product_code === productCode) {
        const product = products.find(p => p.code === productCode);
        if (product) {
          return {
            ...item,
            quantity,
            subtotal: calculateItemSubtotal(product, quantity, item.weight)
          };
        }
      }
      return item;
    }));
  };

  const getCartSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.subtotal, 0);
  };

  const getCartTotal = () => {
    return getCartSubtotal(); // Por enquanto sem desconto
  };

  const openTable = async (table: RestaurantTable) => {
    try {
      setSaving(true);
      
      if (!supabaseConfigured) {
        // Modo demonstração
        const demoSale: TableSale = {
          id: 'demo-sale-' + Date.now(),
          table_id: table.id,
          sale_number: Math.floor(Math.random() * 1000) + 1,
          operator_name: operatorName || 'Operador',
          customer_name: customerName || 'Cliente',
          customer_count: customerCount,
          subtotal: 0,
          discount_amount: 0,
          total_amount: 0,
          status: 'aberta',
          opened_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setCurrentSale(demoSale);
        setSelectedTable({ ...table, status: 'ocupada', current_sale: demoSale });
        return;
      }

      // Criar nova venda
      const { data: sale, error } = await supabase
        .from(getSaleName(storeId))
        .insert([{
          table_id: table.id,
          operator_name: operatorName || 'Operador',
          customer_name: customerName || 'Cliente',
          customer_count: customerCount,
          subtotal: 0,
          discount_amount: 0,
          total_amount: 0,
          status: 'aberta',
          opened_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setCurrentSale(sale);
      setSelectedTable({ ...table, status: 'ocupada', current_sale: sale });
      
      // Atualizar status da mesa
      await supabase
        .from(getTableName(storeId))
        .update({ 
          status: 'ocupada',
          current_sale_id: sale.id
        })
        .eq('id', table.id);

      await fetchTables();
    } catch (error) {
      console.error('Erro ao abrir mesa:', error);
      alert('Erro ao abrir mesa');
    } finally {
      setSaving(false);
    }
  };

  const addItemsToSale = async () => {
    if (!currentSale || cartItems.length === 0) return;

    try {
      setSaving(true);

      if (!supabaseConfigured) {
        // Modo demonstração
        const newTotal = getCartTotal();
        setCurrentSale(prev => prev ? {
          ...prev,
          subtotal: newTotal,
          total_amount: newTotal
        } : null);
        setCartItems([]);
        return;
      }

      // Adicionar itens à venda
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

      const { error: itemsError } = await supabase
        .from(getSaleItemsName(storeId))
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Atualizar totais da venda
      const newSubtotal = currentSale.subtotal + getCartSubtotal();
      const newTotal = newSubtotal - currentSale.discount_amount;

      const { error: updateError } = await supabase
        .from(getSaleName(storeId))
        .update({
          subtotal: newSubtotal,
          total_amount: newTotal
        })
        .eq('id', currentSale.id);

      if (updateError) throw updateError;

      setCurrentSale(prev => prev ? {
        ...prev,
        subtotal: newSubtotal,
        total_amount: newTotal
      } : null);

      setCartItems([]);
    } catch (error) {
      console.error('Erro ao adicionar itens:', error);
      alert('Erro ao adicionar itens à venda');
    } finally {
      setSaving(false);
    }
  };

  const closeSale = async () => {
    if (!currentSale || !selectedTable) return;

    try {
      setSaving(true);

      if (!supabaseConfigured) {
        // Modo demonstração
        setCurrentSale(null);
        setSelectedTable(null);
        setCustomerName('');
        setCustomerCount(1);
        setNotes('');
        return;
      }

      // Fechar venda
      const { error: saleError } = await supabase
        .from(getSaleName(storeId))
        .update({
          status: 'fechada',
          payment_type: paymentType,
          change_amount: changeAmount,
          notes,
          closed_at: new Date().toISOString()
        })
        .eq('id', currentSale.id);

      if (saleError) throw saleError;

      // Liberar mesa
      const { error: tableError } = await supabase
        .from(getTableName(storeId))
        .update({
          status: 'livre',
          current_sale_id: null
        })
        .eq('id', selectedTable.id);

      if (tableError) throw tableError;

      setCurrentSale(null);
      setSelectedTable(null);
      setCustomerName('');
      setCustomerCount(1);
      setNotes('');
      setPaymentType('dinheiro');
      setChangeAmount(0);

      await fetchTables();
    } catch (error) {
      console.error('Erro ao fechar venda:', error);
      alert('Erro ao fechar venda');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTables(), fetchProducts()]);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Carregando vendas de mesas...</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Users size={24} className="text-indigo-600" />
              Vendas de Mesas - Loja {storeId}
            </h2>
            <p className="text-gray-600">Gerencie vendas presenciais por mesa</p>
          </div>
          <button
            onClick={() => {
              fetchTables();
              fetchProducts();
            }}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        {/* Supabase Configuration Warning */}
        {!supabaseConfigured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-full p-2">
                <AlertCircle size={20} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-yellow-800">Modo Demonstração</h3>
                <p className="text-yellow-700 text-sm">
                  Supabase não configurado. Funcionalidades limitadas.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mesas */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Mesas Disponíveis</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {tables.map(table => (
                <div
                  key={table.id}
                  onClick={() => {
                    if (table.status === 'livre') {
                      setSelectedTable(table);
                    } else if (table.current_sale) {
                      setSelectedTable(table);
                      setCurrentSale(table.current_sale);
                    }
                  }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    table.status === 'livre'
                      ? 'border-green-200 bg-green-50 hover:bg-green-100'
                      : table.status === 'ocupada'
                      ? 'border-red-200 bg-red-50 hover:bg-red-100'
                      : 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
                  } ${selectedTable?.id === table.id ? 'ring-2 ring-indigo-500' : ''}`}
                >
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-800">{table.name}</h4>
                    <p className="text-sm text-gray-600">Capacidade: {table.capacity}</p>
                    <div className={`mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                      table.status === 'livre'
                        ? 'bg-green-100 text-green-800'
                        : table.status === 'ocupada'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {table.status === 'livre' ? 'Livre' : 
                       table.status === 'ocupada' ? 'Ocupada' : 
                       table.status === 'aguardando_conta' ? 'Aguardando Conta' : 'Limpeza'}
                    </div>
                    {table.current_sale && (
                      <p className="text-xs text-gray-500 mt-1">
                        Total: {formatPrice(table.current_sale.total_amount)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {tables.length === 0 && (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Nenhuma mesa cadastrada</p>
              </div>
            )}
          </div>

          {/* Venda Atual */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {selectedTable ? `${selectedTable.name} - ${currentSale ? 'Venda Ativa' : 'Nova Venda'}` : 'Selecione uma Mesa'}
            </h3>

            {selectedTable && !currentSale && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Cliente
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  onClick={() => openTable(selectedTable)}
                  disabled={saving || !customerName.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  {saving ? 'Abrindo...' : 'Abrir Mesa'}
                </button>
              </div>
            )}

            {currentSale && (
              <div className="space-y-4">
                {/* Informações da Venda */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Venda:</span>
                      <span className="font-medium ml-1">#{currentSale.sale_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-medium ml-1">{currentSale.customer_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pessoas:</span>
                      <span className="font-medium ml-1">{currentSale.customer_count}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold text-indigo-600 ml-1">
                        {formatPrice(currentSale.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Carrinho */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Adicionar Itens</h4>
                  
                  {/* Busca de Produtos */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar produtos..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Lista de Produtos */}
                  <div className="max-h-40 overflow-y-auto mb-4">
                    <div className="grid grid-cols-1 gap-2">
                      {filteredProducts.map(product => (
                        <div
                          key={product.id}
                          onClick={() => handleProductClick(product)}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              {product.is_weighable ? (
                                <Scale size={16} className="text-indigo-600" />
                              ) : (
                                <Package size={16} className="text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.code}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {product.is_weighable ? (
                              <p className="font-semibold text-indigo-600 text-sm">
                                {formatPrice((product.price_per_gram || 0) * 1000)}/kg
                              </p>
                            ) : (
                              <p className="font-semibold text-indigo-600 text-sm">
                                {formatPrice(product.unit_price || 0)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Itens no Carrinho */}
                  {cartItems.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h5 className="font-medium text-gray-700">Itens a Adicionar:</h5>
                      {cartItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 text-sm">{item.product_name}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span>Qtd: {item.quantity}</span>
                              {item.weight && (
                                <span>Peso: {(item.weight * 1000).toFixed(0)}g</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-indigo-600 text-sm">
                              {formatPrice(item.subtotal)}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.product_code)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="font-medium">Total a Adicionar:</span>
                        <span className="font-bold text-indigo-600">{formatPrice(getCartTotal())}</span>
                      </div>

                      <button
                        onClick={addItemsToSale}
                        disabled={saving}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition-colors"
                      >
                        {saving ? 'Adicionando...' : 'Adicionar à Venda'}
                      </button>
                    </div>
                  )}

                  {/* Finalizar Venda */}
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Forma de Pagamento
                      </label>
                      <select
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value as any)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="dinheiro">Dinheiro</option>
                        <option value="pix">PIX</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                      </select>
                    </div>

                    {paymentType === 'dinheiro' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Troco para:
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={changeAmount}
                          onChange={(e) => setChangeAmount(parseFloat(e.target.value) || 0)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Valor para troco"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observações
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        rows={2}
                        placeholder="Observações da venda..."
                      />
                    </div>

                    <button
                      onClick={closeSale}
                      disabled={saving}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Finalizando...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Finalizar Venda
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            {!selectedTable && (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Selecione uma mesa para começar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Pesagem */}
      {showWeightInput && selectedWeighableProduct && (
        <WeightInputModal
          product={selectedWeighableProduct}
          onConfirmar={handleWeightConfirm}
          onFechar={() => {
            setShowWeightInput(false);
            setSelectedWeighableProduct(null);
          }}
        />
      )}
    </>
  );
};

export default TableSalesPanel;