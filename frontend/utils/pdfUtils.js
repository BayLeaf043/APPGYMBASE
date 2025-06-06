import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const formatDateToLocal = (date) => {
    if (!date) return ""; 
    const d = new Date(date);
    if (isNaN(d.getTime())) return ""; 
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    const day = String(localDate.getDate()).padStart(2, '0');
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const year = localDate.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatTimeToLocal = (time) => {
    if (!time || typeof time !== 'string') return '';
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
  };
/**
 * @param {Object} employee - Інформація про працівника
 * @param {Array} records - Дані для звіту
 * @param {Array} finances - Фінансові дані
 * @param {string} paymentMethod - Вибраний рахунок
 * @param {string} startDate - Початкова дата
 * @param {string} endDate - Кінцева дата
 * @param {Function} t - Функція перекладу
 */
export const generatePDFReport = async (employee, records, startDate, endDate, t) => {
  try {
    let rows = '';
    let total = 0;
    let lastEventId = null;

    for (const rec of records) {
      if (rec.event_id !== lastEventId) {
        rows += `
          <tr style="background-color: #f0f0f0;">
            <td colspan="8"><strong>${t('event')} #${rec.event_id} – ${rec.event_name}</strong></td>
          </tr>`;
        lastEventId = rec.event_id;
      }

      rows += `
        <tr>
          <td>${rec.event_id}</td>
          <td>${rec.event_name}</td>
          <td>${formatDateToLocal(rec.event_date)}</td>
          <td>${formatTimeToLocal(rec.start_time)}–${formatTimeToLocal(rec.end_time)}</td>
          <td>${rec.client_surname} ${rec.client_name}</td>
          <td>#${rec.certificate_id}</td>
          <td>${rec.service_name}</td>
          <td style="text-align:right;">${Number(rec.payment_amount).toFixed(2)}</td>
        </tr>`;

      total += Number(rec.payment_amount);
    }

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ccc; padding: 6px; font-size: 12px; }
            th { background-color: #eee; }
          </style>
        </head>
        <body>
          <h2>${t('salary_report')}</h2>
          <p><strong>${t('period')}:</strong> ${startDate} – ${endDate}</p>
          <p><strong>${t('employee')}:</strong> ${employee.fullName}</p>

          <table>
            <thead>
              <tr>
                <th>${t('event')}</th>
                <th>${t('name')}</th>
                <th>${t('date')}</th>
                <th>${t('time')}</th>
                <th>${t('client')}</th>
                <th>${t('certificate')}</th>
                <th>${t('service')}</th>
                <th>${t('amount')}</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr>
                <td colspan="7" style="text-align: right;"><strong>${t('total')}:</strong></td>
                <td style="text-align: right;"><strong>${total.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    const fileName = `${startDate}-${endDate} ${employee.fullName.replace(/\s/g, '_')}.pdf`;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
      fileName: fileName,
    });

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: t('share_report'),
    });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw new Error(t('failed_to_generate_report'));
  }
};


export const generateFinancePDFReport = async (startDate, endDate, paymentMethod, finances, t) => {
  try {
    let rows = '';
    let total = 0;

    for (const record of finances) {
        const isIncome = record.transaction_type === 'income';
        const amountColor = isIncome ? 'green' : 'red';
        
      rows += `
        <tr>
          <td>${formatDateToLocal(record.create_at)}</td>
          <td>${formatTimeToLocal(record.create_at.split('T')[1])}</td>
          <td>${record.transaction_type === 'income' ? t('income') : t('expense')}</td>
          <td>${record.payment_method === 'cash' ? t('cash') : t('card')}</td>
          <td>${record.comment || ''}</td>
          <td style="text-align:right; color: ${amountColor};">${Number(record.price).toFixed(2)}</td>
        </tr>`;
      total += Number(record.price);
    }

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ccc; padding: 6px; font-size: 12px; }
            th { background-color: #eee; }
          </style>
        </head>
        <body>
          <h2>${t('finance_report')}</h2>
          <p><strong>${t('period')}:</strong> ${formatDateToLocal(startDate)} – ${formatDateToLocal(endDate)}</p>
          <p><strong>${t('payment_method')}:</strong> ${paymentMethod === 'cash' ? t('cash') : t('card')}</p>

          <table>
            <thead>
              <tr>
                <th>${t('date')}</th>
                <th>${t('time')}</th>
                <th>${t('transaction_type')}</th>
                <th>${t('payment_method')}</th>
                <th>${t('comment')}</th>
                <th>${t('amount')}</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr>
                <td colspan="5" style="text-align: right;"><strong>${t('total')}:</strong></td>
                <td style="text-align: right;"><strong>${total.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    const fileName = `Finance_Report_${formatDateToLocal(startDate)}-${formatDateToLocal(endDate)}_${paymentMethod}.pdf`;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
      fileName: fileName,
    });

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: t('share_report'),
    });
  } catch (error) {
    console.error('Error generating finance PDF report:', error);
    throw new Error(t('failed_to_generate_report'));
  }
};


export const generateCertificatePDFReport = async (startDate, endDate, certificates, t) => {
    try {
    let rows = '';
    let total = 0;

    for (const certificate of certificates) {
      rows += `
        <tr>
          <td>${formatDateToLocal(certificate.date_time)}</td>
          <td>${formatTimeToLocal(certificate.date_time.split('T')[1])}</td>
          <td>${certificate.certificate_id}</td>
          <td>${certificate.service_name}</td>
          <td>${certificate.client_name}</td>
          <td>${formatDateToLocal(certificate.valid_from)}</td>
          <td>${formatDateToLocal(certificate.valid_to)}</td>
          <td>${certificate.payment_method === 'cash' ? t('cash') : t('card')}</td>
          <td style="text-align:right;">${Number(certificate.price).toFixed(2)}</td>
        </tr>`;
      total += Number(certificate.price);
    }

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ccc; padding: 6px; font-size: 12px; }
            th { background-color: #eee; }
          </style>
        </head>
        <body>
          <h2>${t('certificates_report')}</h2>
          <p><strong>${t('period')}:</strong> ${formatDateToLocal(startDate)} – ${formatDateToLocal(endDate)}</p>

          <table>
            <thead>
              <tr>
                <th>${t('date')}</th>
                <th>${t('time')}</th>
                <th>${t('#')}</th>
                <th>${t('service')}</th>
                <th>${t('client')}</th>
                <th>${t('valid_from')}</th>
                <th>${t('valid_to')}</th>
                <th>${t('payment_method')}</th>
                <th>${t('amount')}</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr>
                <td colspan="8" style="text-align: right;"><strong>${t('total')}:</strong></td>
                <td style="text-align: right;"><strong>${total.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    const fileName = `Certificate_Report_${formatDateToLocal(startDate)}-${formatDateToLocal(endDate)}.pdf`;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
      fileName: fileName,
    });

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: t('share_report'),
    });
  } catch (error) {
    console.error('Error generating certificate PDF report:', error);
    throw new Error(t('failed_to_generate_report'));
  }
}


