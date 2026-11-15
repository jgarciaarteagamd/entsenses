
import React from 'react';
import { CalculatedValues, CalculationStandard } from '../types.ts';
import { useTranslations } from '../i18n/LanguageContext.tsx';

interface CalculatedValuesPanelProps {
  data: CalculatedValues;
  hideGrade?: boolean;
}

const CalculatedValuesPanel: React.FC<CalculatedValuesPanelProps> = ({ data, hideGrade = false }) => {
  const { t } = useTranslations();

  const parsePta = (val: string) => val ? parseFloat(val) : null;
  
  const ptaR = parsePta(data.ptaOdVa);
  const ptaL = parsePta(data.ptaOiVa);
  const ptaBin = parsePta(data.ptaAoVa);

  const lossLabel = data.standard === CalculationStandard.AAOO 
    ? t('classificationTable.lossAaoo')
    : data.standard === CalculationStandard.AMA
      ? t('classificationTable.lossAma')
      : t('classificationTable.lossAaoHns');

  const unit = "%";

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-100">
                <tr>
                    <th className="px-4 py-3 font-bold w-1/4">{t('classificationTable.parameter')}</th>
                    <th className="px-4 py-3 font-bold text-red-600 w-1/4">{t('classificationTable.rightEar')}</th>
                    <th className="px-4 py-3 font-bold text-blue-600 w-1/4">{t('classificationTable.leftEar')}</th>
                    <th className="px-4 py-3 font-bold text-neutral-700 w-1/4">{t('classificationTable.binaural')}</th>
                </tr>
            </thead>
            <tbody>
                <tr className="bg-white border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{t('classificationTable.pta')}</td>
                    <td className="px-4 py-3 font-bold text-neutral-700">{data.ptaOdVa || '-'} <span className="text-xs font-normal text-neutral-400">dB</span></td>
                    <td className="px-4 py-3 font-bold text-neutral-700">{data.ptaOiVa || '-'} <span className="text-xs font-normal text-neutral-400">dB</span></td>
                    <td className="px-4 py-3 font-bold text-neutral-700">{data.ptaAoVa || '-'} <span className="text-xs font-normal text-neutral-400">dB</span></td>
                </tr>
                
                {data.hasBoneData && (
                    <tr className="bg-white border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="px-4 py-3 font-medium text-neutral-900">{t('classificationTable.ptaBone')}</td>
                        <td className="px-4 py-3 font-bold text-neutral-700">{data.ptaOdBone || '-'} <span className="text-xs font-normal text-neutral-400">dB</span></td>
                        <td className="px-4 py-3 font-bold text-neutral-700">{data.ptaOiBone || '-'} <span className="text-xs font-normal text-neutral-400">dB</span></td>
                        <td className="px-4 py-3 font-bold text-neutral-700">-</td>
                    </tr>
                )}

                <tr className="bg-white hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{lossLabel}</td>
                    <td className="px-4 py-3 font-bold text-neutral-700">{data.pOdVaTotal || '-'} {data.pOdVaTotal && data.pOdVaTotal !== '-' && <span className="text-xs font-normal text-neutral-400">{unit}</span>}</td>
                    <td className="px-4 py-3 font-bold text-neutral-700">{data.pOiVaTotal || '-'} {data.pOiVaTotal && data.pOiVaTotal !== '-' && <span className="text-xs font-normal text-neutral-400">{unit}</span>}</td>
                    <td className="px-4 py-3 font-bold text-neutral-700">{data.pAoVaTotal || '-'} {data.pAoVaTotal && data.pAoVaTotal !== '-' && <span className="text-xs font-normal text-neutral-400">{unit}</span>}</td>
                </tr>
            </tbody>
        </table>
      </div>
      <div className="bg-neutral-50/80 px-4 py-2 text-center border-t border-neutral-100">
          <span className="text-xs text-neutral-500 italic">
              {t('classificationTable.methodologyNotice').replace('{{standard}}', String(data.standard ?? ''))}
          </span>
      </div>
    </div>
  );
};

export default CalculatedValuesPanel;
