// Simple version for debugging - no feature flags, minimal dependencies
import React from 'react';

export const SimpleStartHereSection = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Wo möchtest du 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> starten</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Finance Transformation muss nicht kompliziert sein. Wähle deinen Weg 
            basierend auf deiner Rolle, Erfahrung und den aktuellen Herausforderungen.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <h3 className="text-xl font-bold mb-3 text-green-600">
              Finance Transformation Grundlagen
            </h3>
            <p className="text-gray-600 mb-4">
              Perfekt für Controller und Finance Manager, die systematisch einsteigen möchten.
            </p>
            <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">
              Pfad starten
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <h3 className="text-xl font-bold mb-3 text-blue-600">
              Transformation erfolgreich führen
            </h3>
            <p className="text-gray-600 mb-4">
              Für CFOs und Finance Directors, die Teams durch Transformationen führen.
            </p>
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
              Pfad starten
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <h3 className="text-xl font-bold mb-3 text-purple-600">
              Gezielte Expertenlösungen
            </h3>
            <p className="text-gray-600 mb-4">
              Für erfahrene Professionals mit spezifischen Herausforderungen.
            </p>
            <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">
              Pfad starten
            </button>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 mb-4">
            Vertraut von Finance-Führungskräften bei Everphone, Hugo Boss, Workday, PwC
          </p>
        </div>
      </div>
    </section>
  );
};