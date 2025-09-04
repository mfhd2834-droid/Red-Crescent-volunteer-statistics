from flask import Blueprint, request, jsonify, send_file
from src.models.statistics import db, Statistics
from werkzeug.utils import secure_filename
import os
import json
import pandas as pd
from datetime import datetime
import io

statistics_bp = Blueprint("statistics", __name__)

# المدن المعتمدة
CITIES = [
    "المدينة المنورة",
    "العلا",
    "ينبع",
    "الحناكية",
    "مهد الذهب",
    "بدر",
    "خيبر",
    "وادي الفرع",
    "العيص",
]

# التصنيفات المعتمدة
CATEGORIES = [
    "المجال الاسعافي",
    "التعليم",
    "البيئة",
    "المساعدات الانسانية",
    "الاداري",
    "الإعلامي",
]

def get_category_color(category):
    """إرجاع لون التصنيف"""
    color_map = {
        "الاداري‬‏": "#8B4513",  # بني
        "‫البيئة‬‏": "#28a745",  # أخضر
        "الإعلامي": "#007bff",  # أزرق
        "‫المجال الاسعافي‬‏": "#dc3545",  # أحمر
        "‫التعليم‬‏": "#ffc107",  # أصفر (رياضي)
        "‫المساعدات‬‏ ‫الانسانية‬‏": "#000000",  # أسود
    }
    return color_map.get(category, "#6c757d")

def analyze_excel_file(file_path):
    """تحليل ملف Excel واستخلاص البيانات"""
    try:
        df = pd.read_excel(file_path)

        print(f"DEBUG: DataFrame columns: {df.columns.tolist()}")
        print(f"DEBUG: First 5 rows of DataFrame:\n{df.head()}")

        # استخلاص الشهر والسنة من البيانات الفعلية
        detected_month = datetime.now().month
        detected_year = datetime.now().year

        # محاولة استخلاص الشهر والسنة من تواريخ البداية في الملف
        if "تاريخ البداية" in df.columns:
            try:
                df["تاريخ البداية"] = pd.to_datetime(df["تاريخ البداية"])
                # أخذ الشهر الأكثر تكراراً في البيانات
                month_counts = df["تاريخ البداية"].dt.month.value_counts()
                if not month_counts.empty:
                    detected_month = int(month_counts.index[0])

                # أخذ السنة الأكثر تكراراً في البيانات
                year_counts = df["تاريخ البداية"].dt.year.value_counts()
                if not year_counts.empty:
                    detected_year = int(year_counts.index[0])
            except:
                # في حالة فشل تحويل التاريخ، استخدم التاريخ الحالي
                pass

        all_cities_data = {}
        total_volunteers_all_cities = 0
        total_categories_found = 0

        # معالجة البيانات الفعلية من ملف Excel
        for index, row in df.iterrows():
            city_col_names = ["مدينة / محافظة", "City / Province"]
            category_col_names = ["نوع الفرصة التطوعية", "Opportunity Type"]

            city = ""
            for col_name in city_col_names:
                if col_name in row:
                    city = str(row.get(col_name, "")).strip()
                    break

            category = ""
            for col_name in category_col_names:
                if col_name in row:
                    category = str(row.get(col_name, "")).strip()
                    break
            volunteers_male = int(row.get("عدد المتطوعين", 0))
            volunteers_female = int(row.get("عدد المتطوعات", 0))
            volunteers = volunteers_male + volunteers_female

            # استخراج التفاصيل المطلوبة
            opportunity_number_col_names = ["رقم الفرصة التطوعية", "Volunteer Opportunity Number"]
            opportunity_type_col_names = ["اسم الفرصة التطوعية", "Volunteer Opportunity Name"]
            start_date_col_names = ["تاريخ البداية", "Start Date"]
            end_date_col_names = ["تاريخ النهاية", "End Date"]
            leader_col_names = ["قائد الفرصة", "Opportunity Leader"]

            opportunity_number = "N/A"
            for col_name in opportunity_number_col_names:
                if col_name in row:
                    opportunity_number = str(row.get(col_name, "N/A")).strip()
                    break

            opportunity_name = "N/A"
            for col_name in opportunity_type_col_names:
                if col_name in row:
                    opportunity_name = str(row.get(col_name, "N/A")).strip()
                    break

            start_date = "N/A"
            for col_name in start_date_col_names:
                if col_name in row:
                    start_date = str(row.get(col_name, "N/A")).split(" ")[0].strip()
                    break

            end_date = "N/A"
            for col_name in end_date_col_names:
                if col_name in row:
                    end_date = str(row.get(col_name, "N/A")).split(" ")[0].strip()
                    break

            opportunity_leader = "N/A"
            for col_name in leader_col_names:
                if col_name in row:
                    opportunity_leader = str(row.get(col_name, "N/A")).strip()
                    break

            if city == "المدينة" or city == "المدينة المنورة":
                city = "المدينة المنورة"
            if city in CITIES:
                print(f"DEBUG: Matched city: {city}")
                # Ensure category is in Arabic, if English is provided in Excel
                arabic_category = category
                if category == "Ambulance Field":
                    arabic_category = "المجال الاسعافي"
                elif category == "Education":
                    arabic_category = "التعليم"
                elif category == "Environment":
                    arabic_category = "البيئة"
                elif category == "Humanitarian Aid":
                    arabic_category = "المساعدات الانسانية"
                elif category == "Administrative":
                    arabic_category = "الاداري"
                elif category == "Media":
                    arabic_category = "الإعلامي"

                if arabic_category in CATEGORIES:
                    print(f"DEBUG: Processing row - City: {city}, Category: {arabic_category}, Male: {volunteers_male}, Female: {volunteers_female}, Total: {volunteers}")
                else:
                    print(f"DEBUG: Category \'{arabic_category}\' not in CATEGORIES for city {city}")
                if city not in all_cities_data:
                    all_cities_data[city] = {
                        "data": [],
                        "totalVolunteers": 0,
                        "categoriesFound": 0,
                        "details": [] # إضافة قائمة لتفاصيل الفرص
                    }

                # تحديث البيانات الموجودة أو إضافة جديدة
                found = False
                for item in all_cities_data[city]["data"]:
                    if item["name"] == arabic_category:
                        item["value"] += volunteers
                        found = True
                        break
                if not found:
                    all_cities_data[city]["data"].append({
                        "name": arabic_category,
                        "value": volunteers,
                        "color": get_category_color(arabic_category),
                    })
                    all_cities_data[city]["categoriesFound"] += 1

                all_cities_data[city]["totalVolunteers"] += volunteers
                total_volunteers_all_cities += volunteers
                total_categories_found += 1

                # إضافة التفاصيل إلى قائمة التفاصيل الخاصة بالمدينة
                all_cities_data[city]["details"].append({
                    "opportunity_number": opportunity_number,
                    "opportunity_name": opportunity_name,
                    "opportunity_leader": opportunity_leader,
                    "city": city,
                    "start_date": start_date,
                    "end_date": end_date,
                    "volunteers": volunteers
                })
            else:
                print(f"DEBUG: City '{city}' not in CITIES list.")
        return {
            "detectedMonth": detected_month,
            "detectedYear": detected_year,
            "allCitiesData": all_cities_data,
            "totalVolunteersAllCities": total_volunteers_all_cities,
            "totalCategoriesFound": total_categories_found,
            "citiesCount": len(all_cities_data),
        }

    except Exception as e:
        print(f"Error analyzing Excel file: {e}")  # طباعة الخطأ في السجلات
        raise Exception(f"خطأ في تحليل الملف: {str(e)}")


@statistics_bp.route("/upload", methods=["POST"])
def upload_statistics():
    """رفع ملف الإحصائيات"""
    try:
        if "file" not in request.files:
            return jsonify({"error": "لم يتم إرفاق ملف"}), 400

        file = request.files["file"]
        uploaded_by = request.form.get("uploaded_by", "مجهول")

        if file.filename == "":
            return jsonify({"error": "لم يتم اختيار ملف"}), 400

        if not file.filename.lower().endswith((".xlsx", ".xls")):
            return jsonify({"error": "نوع الملف غير مدعوم. يرجى رفع ملف Excel"}), 400

        # حفظ الملف مؤقتاً
        filename = secure_filename(file.filename)
        upload_folder = os.path.join(os.path.dirname(__file__), "..", "uploads")
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)

        # تحليل الملف
        analysis_result = analyze_excel_file(file_path)

        # حفظ في قاعدة البيانات
        statistics = Statistics(
            filename=filename,
            month=analysis_result["detectedMonth"],
            year=analysis_result["detectedYear"],
            cities_count=analysis_result["citiesCount"],
            total_volunteers=analysis_result["totalVolunteersAllCities"],
            data=analysis_result["allCitiesData"],
            checksum=str(abs(hash(str(analysis_result))))[:50],
            uploaded_by=uploaded_by,
        )

        db.session.add(statistics)
        db.session.commit()

        # حذف الملف المؤقت
        os.remove(file_path)

        return jsonify(
            {
                "success": True,
                "message": "تم رفع الملف وحفظ البيانات بنجاح",
                "data": analysis_result,
                "id": statistics.id,
            }
        )

    except Exception as e:
        return jsonify({"error": f"حدث خطأ: {str(e)}"}), 500


@statistics_bp.route("/list", methods=["GET"])
def list_statistics():
    """عرض قائمة جميع الملفات المرفوعة"""
    try:
        statistics = Statistics.query.order_by(Statistics.upload_date.desc()).all()

        result = []
        for stat in statistics:
            try:
                # تحويل التاريخ إلى string بشكل آمن
                upload_date_str = (
                    stat.upload_date.strftime("%Y-%m-%d %H:%M:%S")
                    if stat.upload_date
                    else "غير محدد"
                )

                result.append(
                    {
                        "id": int(stat.id),
                        "filename": str(stat.filename),
                        "upload_date": upload_date_str,
                        "month": int(stat.month),
                        "year": int(stat.year),
                        "cities_count": int(stat.cities_count),
                        "total_volunteers": int(stat.total_volunteers),
                        "uploaded_by": str(stat.uploaded_by),
                        "checksum": str(stat.checksum),
                    }
                )
            except Exception as item_error:
                print(f"خطأ في معالجة العنصر {{stat.id}}: {{item_error}}")
                continue

        return jsonify({"success": True, "data": result, "count": len(result)})

    except Exception as e:
        print(f"خطأ في list_statistics: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": f"حدث خطأ: {str(e)}"}), 500


@statistics_bp.route("/<int:stat_id>", methods=["GET"])
def get_statistics(stat_id):
    """الحصول على تفاصيل إحصائية معينة"""
    try:
        statistics = Statistics.query.get_or_404(stat_id)
        return jsonify({"success": True, "data": statistics.to_dict()})

    except Exception as e:
        return jsonify({"error": f"حدث خطأ: {str(e)}"}), 500


@statistics_bp.route("/<int:stat_id>", methods=["DELETE"])
def delete_statistics(stat_id):
    """حذف إحصائية معينة"""
    try:
        statistics = Statistics.query.get_or_404(stat_id)
        db.session.delete(statistics)
        db.session.commit()

        return jsonify({"success": True, "message": "تم حذف الإحصائية بنجاح"})

    except Exception as e:
        return jsonify({"error": f"حدث خطأ: {str(e)}"}), 500


@statistics_bp.route("/current", methods=["GET"])
def get_current_statistics():
    """الحصول على أحدث الإحصائيات لعرضها في الصفحة الرئيسية"""
    try:
        # الحصول على أحدث إحصائية
        latest_stat = Statistics.query.order_by(Statistics.upload_date.desc()).first()

        if not latest_stat:
            return jsonify(
                {"success": True, "data": None, "message": "لا توجد إحصائيات متاحة"}
            )

        return jsonify({"success": True, "data": latest_stat.to_dict()})

    except Exception as e:
        return jsonify({"error": f"حدث خطأ: {str(e)}"}), 500





@statistics_bp.route("/export_excel", methods=["GET"])
def export_statistics_to_excel():
    """تصدير الإحصائيات إلى ملف Excel بناءً على الشهر والسنة"""
    try:
        month = request.args.get("month", type=int)
        year = request.args.get("year", type=int)
        city = request.args.get("city", "")

        print(f"DEBUG: Export request - month: {month}, year: {year}, city: {city}")

        if not month or not year:
            print("DEBUG: Missing month or year")
            return jsonify({"error": "الرجاء تحديد الشهر والسنة للتصدير"}), 400

        # جلب الإحصائيات من قاعدة البيانات بناءً على الشهر والسنة
        stats_entries = Statistics.query.filter_by(month=month, year=year).all()
        print(f"DEBUG: Found {len(stats_entries)} statistics entries for {month}/{year}")

        if not stats_entries:
            print("DEBUG: No statistics entries found")
            return jsonify({"message": "لا توجد بيانات لهذا الشهر والسنة"}), 404

        # تجميع البيانات لتصديرها
        export_data = []
        for entry in stats_entries:
            print(f"DEBUG: Processing entry ID {entry.id}")
            print(f"DEBUG: Entry data keys: {list(entry.data.keys()) if entry.data else 'No data'}")
            
            if not entry.data:
                print("DEBUG: Entry has no data")
                continue
                
            for city_name, city_data in entry.data.items():
                print(f"DEBUG: Processing city: {city_name}")
                
                # إذا تم تحديد مدينة معينة، تصفية البيانات لهذه المدينة فقط
                if city and city_name != city:
                    print(f"DEBUG: Skipping city {city_name} (looking for {city})")
                    continue
                
                details = city_data.get("details", [])
                print(f"DEBUG: City {city_name} has {len(details)} details")
                
                for detail in details:
                    print(f"DEBUG: Processing detail: {detail}")
                    
                    # الحصول على عدد المتطوعين لهذه الفرصة المحددة
                    total_volunteers_for_opportunity = detail.get("volunteers", 0)
                    
                    export_row = {
                        "رقم الفرصة التطوعية": detail.get("opportunity_number", "N/A"),
                        "قائد الفرصة": detail.get("opportunity_leader", "N/A"),
                        "اسم الفرصة التطوعية": detail.get("opportunity_name", "N/A"),
                        "تاريخ البداية": detail.get("start_date", "N/A"),
                        "تاريخ النهاية": detail.get("end_date", "N/A"),
                        "اجمالي عدد المتطوعين": total_volunteers_for_opportunity
                    }
                    
                    print(f"DEBUG: Adding export row: {export_row}")
                    export_data.append(export_row)

        print(f"DEBUG: Total export data rows: {len(export_data)}")

        if not export_data:
            print("DEBUG: No export data generated")
            return jsonify({"message": "لا توجد فرص تطوعية مفصلة لهذا الشهر والسنة"}), 404

        df_export = pd.DataFrame(export_data)
        print(f"DEBUG: DataFrame created with shape: {df_export.shape}")
        print(f"DEBUG: DataFrame columns: {list(df_export.columns)}")
        print(f"DEBUG: DataFrame head:\n{df_export.head()}")

        # إنشاء ملف Excel في الذاكرة
        output = io.BytesIO()
        writer = pd.ExcelWriter(output, engine='xlsxwriter')
        df_export.to_excel(writer, index=False, sheet_name='Statistics')
        writer.close()
        output.seek(0)

        print(f"DEBUG: Excel file created successfully, size: {len(output.getvalue())} bytes")

        response = send_file(
            output,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            download_name=f"statistics_{city}_{year}_{month}.xlsx",
            as_attachment=True
        )
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
    except Exception as e:
        print(f"ERROR: Exception in export_statistics_to_excel: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"حدث خطأ في التصدير: {str(e)}"}), 500



