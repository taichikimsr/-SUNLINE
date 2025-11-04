let reserveChart = null;

function formatCurrency(amount) {
    return '¥' + Math.round(amount).toLocaleString('ja-JP');
}

function validate() {
    const currentBalance = parseFloat(document.getElementById('currentBalance').value) || 0;
    const monthlyReserve = parseFloat(document.getElementById('monthlyReserve').value) || 0;
    const unitCount = parseInt(document.getElementById('unitCount').value) || 1;
    const yearlyRepair = parseFloat(document.getElementById('yearlyRepair').value) || 0;
    const majorRepairCost = parseFloat(document.getElementById('majorRepairCost').value) || 0;
    const yearsUntilRepair = parseInt(document.getElementById('yearsUntilRepair').value) || 0;

    if (yearsUntilRepair <= 0) {
        alert('大規模修繕までの期間を入力してください。');
        return null;
    }

    if (monthlyReserve < 0 || currentBalance < 0 || yearlyRepair < 0 || majorRepairCost < 0) {
        alert('金額は0以上の値を入力してください。');
        return null;
    }

    if (unitCount <= 0) {
        alert('戸数は1以上の値を入力してください。');
        return null;
    }

    return {
        currentBalance,
        monthlyReserve,
        unitCount,
        yearlyRepair,
        majorRepairCost,
        yearsUntilRepair
    };
}

function calculate() {
    const data = validate();
    if (!data) return;

    const {
        currentBalance,
        monthlyReserve,
        unitCount,
        yearlyRepair,
        majorRepairCost,
        yearsUntilRepair
    } = data;

    // 計算
    const monthlyReserveTotal = monthlyReserve * unitCount;
    const totalReserve = monthlyReserveTotal * 12 * yearsUntilRepair;
    const totalRepairCost = yearlyRepair * yearsUntilRepair;
    const projectedBalance = currentBalance + totalReserve - totalRepairCost;
    const shortage = majorRepairCost - projectedBalance;

    // 結果を表示
    document.getElementById('displayCurrentBalance').textContent = formatCurrency(currentBalance);
    document.getElementById('totalReserve').textContent = formatCurrency(totalReserve);
    document.getElementById('totalRepairCost').textContent = formatCurrency(totalRepairCost);
    document.getElementById('projectedBalance').textContent = formatCurrency(projectedBalance);
    document.getElementById('displayMajorCost').textContent = formatCurrency(majorRepairCost);

    const shortageItem = document.getElementById('shortageItem');
    const shortageLabel = document.getElementById('shortageLabel');
    const shortageValue = document.getElementById('shortage');
    const additionalInfo = document.getElementById('additionalInfo');

    if (shortage > 0) {
        // 不足がある場合
        shortageLabel.textContent = '不足金額';
        shortageValue.textContent = formatCurrency(shortage);
        shortageItem.className = 'result-item highlight shortage-negative';

        // 追加必要な積立金を計算
        const monthsRemaining = yearsUntilRepair * 12;
        const additionalMonthlyTotal = shortage / monthsRemaining;
        const additionalMonthlyPerUnit = additionalMonthlyTotal / unitCount;

        document.getElementById('additionalMonthly').textContent = formatCurrency(additionalMonthlyTotal);
        document.getElementById('additionalMonthlyPerUnit').textContent = formatCurrency(additionalMonthlyPerUnit);

        additionalInfo.style.display = 'block';
    } else {
        // 余剰がある場合
        shortageLabel.textContent = '余剰金額';
        shortageValue.textContent = formatCurrency(Math.abs(shortage));
        shortageItem.className = 'result-item highlight shortage-positive';
        additionalInfo.style.display = 'none';
    }

    // 結果セクションを表示
    document.getElementById('resultSection').style.display = 'block';

    // グラフを描画
    drawChart(data, totalReserve, totalRepairCost, projectedBalance);

    // スムーズにスクロール
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function drawChart(data, totalReserve, totalRepairCost, projectedBalance) {
    const { currentBalance, monthlyReserve, unitCount, yearlyRepair, yearsUntilRepair } = data;

    // 年ごとのデータを生成
    const labels = ['現在'];
    const balanceData = [currentBalance];
    const monthlyReserveTotal = monthlyReserve * unitCount;

    for (let year = 1; year <= yearsUntilRepair; year++) {
        labels.push(`${year}年後`);
        const accumulatedReserve = monthlyReserveTotal * 12 * year;
        const accumulatedRepair = yearlyRepair * year;
        const balance = currentBalance + accumulatedReserve - accumulatedRepair;
        balanceData.push(balance);
    }

    const ctx = document.getElementById('reserveChart').getContext('2d');

    // 既存のチャートを破棄
    if (reserveChart) {
        reserveChart.destroy();
    }

    reserveChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '予想積立金残高',
                data: balanceData,
                borderColor: 'rgb(102, 126, 234)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Enterキーで計算を実行
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculate();
            }
        });
    });
});
