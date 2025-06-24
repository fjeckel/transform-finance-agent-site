import React from 'react';

const BoringFormatsSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="bg-gray-200 rounded-2xl aspect-square flex items-center justify-center text-gray-500">
            {/* Bild Platzhalter */}
            <span>Bild</span>
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 font-cooper">
              Die meisten Business / Accounting Formate sind trocken wie die Bilanzsumme...
            </h2>
            <p className="text-xl text-gray-800 mb-4 font-semibold">Klingt vertraut?</p>
            <ul className="list-disc pl-6 space-y-2 text-lg text-gray-700">
              <li>Trockene Zahlen, gestelztes Gerede, uninspirierte Interviews.</li>
              <li>KI, ERP, ESG. Viele reden über Transformation, wenige verstehen sie.</li>
              <li>News von gestern sind morgen schon vergessen. Relevanz? Fehlanzeige.</li>
              <li>Die meisten Formate sprechen über Finance, aber nie mit den Menschen dahinter.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BoringFormatsSection;
