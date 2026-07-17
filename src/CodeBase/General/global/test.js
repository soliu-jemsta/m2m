MainApplication.getMortgageDetails = function () {
    var transQuery = [
        {
            ascending: "TRUE",
            orderby: "Title",
        }
    ];

    $spcontext.getItem(
        "MortgageTypes",
        $spcontext.camlBuilder(transQuery),
        function (_spMeta) {

            MainApplication.mortgageTypes = [];
            MainApplication.mortgageCategory = [];
            MainApplication.mortgageCategoryItems = {};

            const listEnumerator = _spMeta.getEnumerator();

            while (listEnumerator.moveNext()) {

                const item = listEnumerator.get_current();

                const name = item.get_item("Title") || "";
                const category = item.get_item("Category")
                    ? item.get_item("Category").get_lookupValue()
                    : "";

                // Flat array
                MainApplication.mortgageTypes.push({
                    name,
                    category
                });

                // Unique categories
                if (
                    category &&
                    !MainApplication.mortgageCategory.includes(category)
                ) {
                    MainApplication.mortgageCategory.push(category);
                }

                // Group by category
                if (!MainApplication.mortgageCategoryItems[category]) {
                    MainApplication.mortgageCategoryItems[category] = [];
                }

                MainApplication.mortgageCategoryItems[category].push({
                    name,
                    category
                });
            }

            console.log(MainApplication.mortgageCategory);
            console.log(MainApplication.mortgageCategoryItems);
        }
    );
};