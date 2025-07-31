import React, { useState } from 'react';
import { X, Scale, Check, Calculator } from 'lucide-react';
import { PDVProduct } from '../../types/pdv';

interface WeightInputModalProps {
  product: PDVProduct;
  onConfirmar: (weightInKg: number) => void;
  onFechar: () => void;
}

const WeightInputModal: React.FC<WeightInputModalProps> = ({ 
  product, 
  onConfirmar, 
  onFechar 
}) => {
  const [weightInput, setWeightInput] = useState<string>('');
  const [weightUnit, setWeightUnit] = useState<'g' | 'kg'>('g');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getWeightInKg = (): number => {
    const weight = parseFloat(weightInput) || 0;
    return weightUnit === 'kg' ? weight : weight / 1000;
  };

  const getCalculatedPrice = (): number => {
    const weightInKg = getWeightInKg();
    return weightInKg * (product.price_per_gram || 0) * 1000; // price_per_gram * 1000 para converter para preço por kg
  };

  const handleConfirm = () => {
    const weightInKg = getWeightInKg();
    if (weightInKg > 0) {
      onConfirmar(weightInKg);
    }
  };

  const handleQuickWeight = (grams: number) => {
    setWeightInput(grams.toString());
    setWeightUnit('g');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-500 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                  <Scale size={24} className="text-white" />
                </div>
                <h2 className="text-xl font-bold">Informar Peso</h2>
              </div>
              <button
                onClick={onFechar}
                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            <p className="text-white/90 truncate">{product.name}</p>
            <p className="text-white/80 text-sm">
              Preço: {formatPrice((product.price_per_gram || 0) * 1000)}/kg
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Input de peso */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso do produto
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="Digite o peso"
                  className="flex-1 p-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  autoFocus
                />
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value as 'g' | 'kg')}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="g">gramas</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>
            
            {/* Botões de peso rápido */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Pesos rápidos:</p>
              <div className="grid grid-cols-3 gap-2">
                {[100, 200, 300, 500, 750, 1000].map((grams) => (
                  <button
                    key={grams}
                    onClick={() => handleQuickWeight(grams)}
                    className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                  >
                    {grams}g
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cálculo do preço */}
          {weightInput && parseFloat(weightInput) > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 rounded-full p-2">
                  <Calculator size={20} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-800">
                    Peso: {weightInput}{weightUnit} 
                    {weightUnit === 'g' && ` (${(parseFloat(weightInput) / 1000).toFixed(3)} kg)`}
                  </p>
                  <p className="text-green-700 text-lg font-bold">
                    Preço: {formatPrice(getCalculatedPrice())}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botão confirmar */}
          <button
            onClick={handleConfirm}
            disabled={!weightInput || parseFloat(weightInput) <= 0}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
              !weightInput || parseFloat(weightInput) <= 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <Check size={24} />
              <span>Confirmar Peso</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeightInputModal;